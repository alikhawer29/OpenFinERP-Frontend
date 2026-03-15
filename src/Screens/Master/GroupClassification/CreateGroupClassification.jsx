import { Formik } from "formik";
import BackButton from "../../../Components/BackButton";
import { groupClassificationValidationSchema } from "../../../Utils/Validations/ValidationSchemas";
import CustomButton from "../../../Components/CustomButton";
import SearchableSelect from "../../../Components/SearchableSelect/SearchableSelect";
import CustomInput from "../../../Components/CustomInput";
import { Form } from "react-bootstrap";

const CreateGroupClassfification = () => {
    const handleSubmit = (values) => {
        console.log("Values: ", values);
    }
    return (
        <>
            <div className="d-flex align-items-start mb-4 justify-content-between flex-wrap">
                <div className="d-flex flex-column gap-2">
                    <BackButton />
                    <h2 className="screen-title m-0 d-inline">Create Group</h2>
                </div>
            </div>
            <div className="d-card">
                <div className="row">
                    <div className="col-12 col-lg-10 col-xl-9 col-xxl-7">
                        <Formik
                            initialValues={{
                                group_name: '',
                                ledger: '',
                            }}
                            validationSchema={groupClassificationValidationSchema}
                            onSubmit={handleSubmit}
                        >
                            {({
                                values,
                                handleChange,
                                handleBlur,
                                setFieldValue,
                                errors,
                                touched,
                            }) => (
                                <Form>
                                    <div className="row mb-4">
                                        <div className="col-12 col-sm-6 mb-3">
                                            <CustomInput
                                                label="Group Name"
                                                id="group_name"
                                                name="group_name"
                                                placeholder="Enter group Name"
                                                type="text"
                                                value={values.group_name}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                error={errors.group_name}
                                                touched={touched.group_name}
                                            />
                                        </div>

                                        <div className="col-12 col-sm-6 mb-45">
                                            <SearchableSelect
                                                label="Ledger"
                                                name="ledger"
                                                id="ledger"
                                                error={errors.ledger}
                                                touched={touched.ledger}
                                                options={[{ label: "check", value: "check" }]}
                                                value={values.ledger}
                                                onChange={(v) => setFieldValue('ledger', v.value)}
                                                placeholder="Select Ledger"
                                            />
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center" >
                                        <div className="d-flex mb-4 me-4">
                                            <CustomButton variant={'secondaryButton'} text="Cancel" />
                                        </div>
                                        <div className="d-flex mb-4">
                                            <CustomButton type="submit" text="Generate" disabled={errors.ledger || errors.group_name} />
                                        </div>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </div>
                </div>
            </div>
        </>
    )
}


export default CreateGroupClassfification;