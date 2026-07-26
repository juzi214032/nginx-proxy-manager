#!/command/with-contenv bash
# shellcheck shell=bash

# This command reads the `NPM_HTTPS_PORT` env var and will fall
# back to 443 if this is not set or is not a number.

set -e

log_info 'HTTPS Port ...'

NPM_HTTPS_PORT="${NPM_HTTPS_PORT:-443}"
# ensure https port is a number
if ! [[ "$NPM_HTTPS_PORT" =~ ^[0-9]+$ ]]; then
	echo "WARNING: NPM_HTTPS_PORT must be a number. Defaulting to 443" >&2
	NPM_HTTPS_PORT=443
fi

if [ "$NPM_HTTPS_PORT" != "443" ]; then
	DEFAULTCONF="/etc/nginx/conf.d/default.conf"
	if is_mounted "$DEFAULTCONF"; then
		echo "WARNING: skipping ${DEFAULTCONF} — mounted file" >&2
	elif [ -f "$DEFAULTCONF" ]; then
		sed -i -E \
			-e "s/listen 443 ssl;/listen ${NPM_HTTPS_PORT} ssl;/" \
			-e "s/listen \[::\]:443 ssl;/listen [::]:${NPM_HTTPS_PORT} ssl;/" \
			-e "s/set \\\$port \"443\";/set \$port \"${NPM_HTTPS_PORT}\";/" \
			"$DEFAULTCONF"
		log_info "Set fallback HTTPS port to ${NPM_HTTPS_PORT} in ${DEFAULTCONF}"
	fi

	FORCESSLCONF="/etc/nginx/conf.d/include/force-ssl.conf"
	if is_mounted "$FORCESSLCONF"; then
		echo "WARNING: skipping ${FORCESSLCONF} — mounted file" >&2
	elif [ -f "$FORCESSLCONF" ]; then
		sed -i \
			-e "s|return 301 https://\$host\$request_uri;|return 301 https://\$host:${NPM_HTTPS_PORT}\$request_uri;|" \
			"$FORCESSLCONF"
		log_info "Set force-ssl redirect port to ${NPM_HTTPS_PORT} in ${FORCESSLCONF}"
	fi
fi
