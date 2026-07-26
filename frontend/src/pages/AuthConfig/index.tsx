import CodeEditor from "@uiw/react-textarea-code-editor";
import { Field, Form, Formik } from "formik";
import { type ReactNode, useState } from "react";
import { Alert } from "react-bootstrap";
import { Button, HasPermission, Loading } from "src/components";
import { useSetSetting, useSetting } from "src/hooks";
import { T } from "src/locale";
import { ADMIN, VIEW } from "src/modules/Permissions";
import { showObjectSuccess } from "src/notifications";

const editorStyle = {
	fontFamily: "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
	borderRadius: "0.3rem",
	minHeight: "260px",
	backgroundColor: "var(--tblr-bg-surface-dark)",
};

function AuthConfigForm() {
	const { data, isLoading, error } = useSetting("authelia");
	const { mutate: setSetting } = useSetSetting();
	const [errorMsg, setErrorMsg] = useState<ReactNode | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const onSubmit = async (values: any, { setSubmitting }: any) => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		setErrorMsg(null);

		const payload = {
			id: "authelia",
			meta: {
				locationSnippet: values.locationSnippet,
				authrequestSnippet: values.authrequestSnippet,
			},
		} as any;

		setSetting(payload, {
			onError: (err: any) => setErrorMsg(<T id={err.message} />),
			onSuccess: () => {
				showObjectSuccess("setting", "saved");
			},
			onSettled: () => {
				setIsSubmitting(false);
				setSubmitting(false);
			},
		});
	};

	if (!isLoading && error) {
		return (
			<div className="card-body">
				<div className="mb-3">
					<Alert variant="danger" show>
						{error.message}
					</Alert>
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="card-body">
				<div className="mb-3">
					<Loading noLogo />
				</div>
			</div>
		);
	}

	return (
		<Formik
			initialValues={
				{
					locationSnippet: data?.meta?.locationSnippet || "",
					authrequestSnippet: data?.meta?.authrequestSnippet || "",
				} as any
			}
			onSubmit={onSubmit}
		>
			{() => (
				<Form>
					<div className="card-body">
						<Alert variant="danger" show={!!errorMsg} onClose={() => setErrorMsg(null)} dismissible>
							{errorMsg}
						</Alert>
						<p className="text-secondary">
							<T id="auth-config.description" />
						</p>
						<Field name="locationSnippet">
							{({ field }: any) => (
								<div className="mb-3">
									<label className="form-label" htmlFor="locationSnippet">
										<T id="auth-config.location-snippet" />
									</label>
									<div className="text-secondary small mb-2">
										<T id="auth-config.location-snippet.help" />
									</div>
									<CodeEditor
										language="nginx"
										padding={15}
										data-color-mode="dark"
										minHeight={260}
										indentWidth={4}
										style={editorStyle}
										{...field}
									/>
								</div>
							)}
						</Field>
						<Field name="authrequestSnippet">
							{({ field }: any) => (
								<div className="mb-3">
									<label className="form-label" htmlFor="authrequestSnippet">
										<T id="auth-config.authrequest-snippet" />
									</label>
									<div className="text-secondary small mb-2">
										<T id="auth-config.authrequest-snippet.help" />
									</div>
									<CodeEditor
										language="nginx"
										padding={15}
										data-color-mode="dark"
										minHeight={260}
										indentWidth={4}
										style={editorStyle}
										{...field}
									/>
								</div>
							)}
						</Field>
					</div>
					<div className="card-footer bg-transparent mt-auto">
						<div className="btn-list justify-content-end">
							<Button
								type="submit"
								actionType="primary"
								className="ms-auto bg-teal"
								isLoading={isSubmitting}
								disabled={isSubmitting}
							>
								<T id="save" />
							</Button>
						</div>
					</div>
				</Form>
			)}
		</Formik>
	);
}

const AuthConfig = () => {
	return (
		<HasPermission section={ADMIN} permission={VIEW} pageLoading loadingNoLogo>
			<div className="card mt-4">
				<div className="card-status-top bg-teal" />
				<div className="card-header">
					<div className="row w-full">
						<h2 className="mt-1 mb-0">
							<T id="auth-config" />
						</h2>
					</div>
				</div>
				<AuthConfigForm />
			</div>
		</HasPermission>
	);
};

export default AuthConfig;
