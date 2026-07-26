import { installPlugins } from "./lib/certbot.js";
import utils from "./lib/utils.js";
import { setup as logger } from "./logger.js";
import authModel from "./models/auth.js";
import certificateModel from "./models/certificate.js";
import settingModel from "./models/setting.js";
import userModel from "./models/user.js";
import userPermissionModel from "./models/user_permission.js";
import fs from "fs/promises";

export const isSetup = async () => {
	const row = await userModel.query().select("id").where("is_deleted", 0).first();
	return row?.id > 0;
}

/**
 * Creates a default admin users if one doesn't already exist in the database
 *
 * @returns {Promise}
 */
const setupDefaultUser = async () => {
	const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL;
	const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD;

	// This will only create a new user when there are no active users in the database
	// and the INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD environment variables are set.
	// Otherwise, users should be shown the setup wizard in the frontend.
	// I'm keeping this legacy behavior in case some people are automating deployments.

	if (!initialAdminEmail || !initialAdminPassword) {
		return Promise.resolve();
	}

	const userIsetup = await isSetup();
	if (!userIsetup) {
		// Create a new user and set password
		logger.info(`Creating a new user: ${initialAdminEmail} with password: ${initialAdminPassword}`);

		const data = {
			is_deleted: 0,
			email: initialAdminEmail,
			name: "Administrator",
			nickname: "Admin",
			avatar: "",
			roles: ["admin"],
		};

		const user = await userModel
			.query()
			.insertAndFetch(data);

		await authModel
			.query()
			.insert({
				user_id: user.id,
				type: "password",
				secret: initialAdminPassword,
				meta: {},
			});

		await userPermissionModel.query().insert({
			user_id: user.id,
			visibility: "all",
			proxy_hosts: "manage",
			redirection_hosts: "manage",
			dead_hosts: "manage",
			streams: "manage",
			access_lists: "manage",
			certificates: "manage",
		});
		logger.info("Initial admin setup completed");
	}
};

/**
 * Creates default settings if they don't already exist in the database
 *
 * @returns {Promise}
 */
const setupDefaultSettings = async () => {
	const row = await settingModel
		.query()
		.select("id")
		.where({ id: "default-site" })
		.first();

	if (!row?.id) {
		await settingModel
			.query()
			.insert({
				id: "default-site",
				name: "Default Site",
				description: "What to show when Nginx is hit with an unknown Host",
				value: "congratulations",
				meta: {},
			});
		logger.info("Default settings added");
	}

	const certRow = await settingModel
		.query()
		.select("id")
		.where({ id: "default-certificate" })
		.first();

	if (!certRow?.id) {
		await settingModel
			.query()
			.insert({
				id: "default-certificate",
				name: "Default Certificate",
				description: "Certificate preselected when creating new hosts",
				value: "0",
				meta: {},
			});
		logger.info("Default certificate setting added");
	}

	const portRow = await settingModel
		.query()
		.select("id")
		.where({ id: "public-port" })
		.first();

	if (!portRow?.id) {
		await settingModel
			.query()
			.insert({
				id: "public-port",
				name: "Public Port",
				description: "Public facing port appended to domains for display only",
				value: "0",
				meta: {},
			});
		logger.info("Public port setting added");
	}

	const autheliaRow = await settingModel
		.query()
		.select("id")
		.where({ id: "authelia" })
		.first();

	if (!autheliaRow?.id) {
		await settingModel
			.query()
			.insert({
				id: "authelia",
				name: "Authelia",
				description: "Authelia authentication nginx snippets for protected hosts",
				value: "custom",
				meta: {
					location_snippet: `location /authelia {
    set $upstream_authelia http://192.168.66.2:9091/api/verify;

    internal;
    proxy_pass $upstream_authelia;

    proxy_set_header X-Original-URL $scheme://$http_host$request_uri;
    proxy_set_header X-Original-Method $request_method;
    proxy_set_header X-Forwarded-Method $request_method;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $http_host;
    proxy_set_header X-Forwarded-Uri $request_uri;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header Content-Length "";
    proxy_set_header Connection "";

    proxy_pass_request_body off;
    proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
    proxy_redirect http:// $scheme://;
    proxy_http_version 1.1;
    proxy_cache_bypass $cookie_session;
    proxy_no_cache $cookie_session;
    proxy_buffers 4 32k;
    client_body_buffer_size 128k;

    send_timeout 5m;
    proxy_read_timeout 240;
    proxy_send_timeout 240;
    proxy_connect_timeout 240;
}`,
					authrequest_snippet: `auth_request /authelia;

set $target_url $scheme://$http_host$request_uri;

auth_request_set $user $upstream_http_remote_user;
auth_request_set $groups $upstream_http_remote_groups;
auth_request_set $name $upstream_http_remote_name;
auth_request_set $email $upstream_http_remote_email;

proxy_set_header Remote-User $user;
proxy_set_header Remote-Groups $groups;
proxy_set_header Remote-Name $name;
proxy_set_header Remote-Email $email;

error_page 401 =302 https://auth.juzibiji.top/?rd=$target_url;`,
				},
			});
		logger.info("Authelia setting added");
	}
};

/**
 * Installs all Certbot plugins which are required for an installed certificate
 *
 * @returns {Promise}
 */
const setupCertbotPlugins = async () => {
	const certificates = await certificateModel
		.query()
		.where("is_deleted", 0)
		.andWhere("provider", "letsencrypt");

	if (certificates?.length) {
		const plugins = [];
		const promises = [];

		certificates.map((certificate) => {
			if (certificate.meta && certificate.meta.dns_challenge === true) {
				if (plugins.indexOf(certificate.meta.dns_provider) === -1) {
					plugins.push(certificate.meta.dns_provider);
				}

				// Make sure credentials file exists
				const credentials_loc = `/etc/letsencrypt/credentials/credentials-${certificate.id}`;
				if (typeof certificate.meta.dns_provider_credentials === "string") {
					promises.push(fs.mkdir("/etc/letsencrypt/credentials", { recursive: true })
								  .then(() => fs.writeFile(credentials_loc, certificate.meta.dns_provider_credentials, { mode: 0o600, flag: "wx" }))
								  .catch((err) => { if (err.code !== "EEXIST") throw err; }));
				}
			}
			return true;
		});
		
		await installPlugins(plugins);

		if (promises.length) {
			await Promise.all(promises);
			logger.info(`Added Certbot plugins ${plugins.join(", ")}`);
		}
	}
};

/**
 * Starts a timer to call run the logrotation binary every two days
 * @returns {Promise}
 */
const setupLogrotation = () => {
	const intervalTimeout = 1000 * 60 * 60 * 24 * 2; // 2 days

	const runLogrotate = async () => {
		try {
			await utils.exec("logrotate /etc/logrotate.d/nginx-proxy-manager");
			logger.info("Logrotate completed.");
		} catch (e) {
			logger.warn(e);
		}
	};

	logger.info("Logrotate Timer initialized");
	setInterval(runLogrotate, intervalTimeout);
	// And do this now as well
	return runLogrotate();
};

export default () => setupDefaultUser().then(setupDefaultSettings).then(setupCertbotPlugins).then(setupLogrotation);
