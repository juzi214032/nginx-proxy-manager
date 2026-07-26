import { Field, Form, Formik } from "formik";
import { type ReactNode, useState } from "react";
import { Alert } from "react-bootstrap";
import { Button, Loading } from "src/components";
import { useSetSetting, useSetting } from "src/hooks";
import { T } from "src/locale";
import { showObjectSuccess } from "src/notifications";

export default function PublicPort() {
	const { data, isLoading, error } = useSetting("public-port");
	const { mutate: setSetting } = useSetSetting();
	const [errorMsg, setErrorMsg] = useState<ReactNode | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const onSubmit = async (values: any, { setSubmitting }: any) => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		setErrorMsg(null);

		const payload = {
			id: "public-port",
			value: String(values.port || 0),
		};

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
					port: Number(data?.value || 0) || "",
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
						<Field name="port">
							{({ field, form }: any) => (
								<div className="mb-3">
									<label className="form-label" htmlFor="public-port">
										<T id="settings.public-port.description" />
									</label>
									<input
										id="public-port"
										type="number"
										min={0}
										max={65535}
										placeholder="443"
										autoComplete="off"
										className="form-control"
										{...field}
									/>
									<small className="form-hint">
										<T id="settings.public-port.hint" />
									</small>
									{form.errors.port ? (
										<div className="invalid-feedback">
											{form.errors.port && form.touched.port ? form.errors.port : null}
										</div>
									) : null}
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
								data-bs-dismiss="modal"
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
