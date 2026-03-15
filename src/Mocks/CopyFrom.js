// Screen Basic Skeleton
{
  <section>
    <div className="d-flex gap-3 justify-content-between flex-wrap mb-4">
      <h2 className="screen-title mb-0">Heading goes here</h2>
      {/* Remove div below for screen with no top buttons */}
      <div className="d-flex gap-2">
        <CustomButton text={'New'} onClick={() => setIsDisabled(false)} />
      </div>
    </div>
    <Row>
      <Col xs={12}>
        <CustomTable
          headers={journalVoucherHeaders} // Headers come from TableHeaders file
          className={'inputTable'} // Add this class for tables with input fields
        >
          <tbody>
            {Object.values(rows).map((row, index) => {
              return (
                <tr key={row.id}>
                  <td>{index + 1}</td>
                  <td>
                    <SearchableSelect
                      isDisabled={isDisabled}
                      options={[
                        { label: 'PL', value: 'party' },
                        { label: 'GL', value: 'general' },
                        { label: 'WIC', value: 'walkin' },
                      ]}
                      placeholder="Ledger"
                      value={row.ledger}
                      onChange={(selected) => {
                        handleChange(row.id, 'ledger', selected.value);
                      }}
                      borderRadius={10}
                    />
                  </td>
                  <td>
                    <SearchableSelect
                      isDisabled={isDisabled}
                      options={getAccountsByTypeOptions(row.ledger)}
                      placeholder="Account"
                      value={row.account}
                      onChange={(selected) => {
                        if (
                          selected.label?.toLowerCase()?.startsWith('add new')
                        ) {
                          setShowAddLedgerModal(selected.label?.toLowerCase());
                        } else {
                          handleChange(row.id, 'account', selected.value);
                        }
                      }}
                      borderRadius={10}
                      minWidth={240}
                    />
                  </td>
                  <td>
                    <CustomInput
                      type={'text'}
                      value={row.narration}
                      placeholder="Enter Narration"
                      disabled={isDisabled}
                      onChange={(e) =>
                        handleChange(row.id, 'narration', e.target.value)
                      }
                      borderRadius={10}
                      style={{ minWidth: 300 }}
                    />
                  </td>
                  <td>
                    <TableActionDropDown
                      actions={[
                        {
                          name: 'View',
                          icon: HiOutlineEye,
                          onClick: () => handleActionClick(item, 'view'),
                          className: 'view',
                        },
                        {
                          name: 'Edit',
                          icon: HiOutlinePencilSquare,
                          onClick: () => handleActionClick(item, 'edit'),
                          className: 'edit',
                        },
                        {
                          name: 'Delete',
                          icon: HiOutlineTrash,
                          onClick: () => handleActionClick(item, 'delete'),
                          className: 'delete',
                        },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </CustomTable>
      </Col>
    </Row>
  </section>;
}
//////// Screen Basic Skeleton End ////////
//
//
//
//
//
//
// --- Popup Ledgers --- //
/* Add New Ledger Modal */
{
  const [showAddLedgerModal, setShowAddLedgerModal] = useState('');

  const renderAddLedgerForm = () => {
    switch (showAddLedgerModal) {
      case 'add new pl':
        return (
          <PartyLedgerForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setShowAddLedgerModal('');
            }}
            onCancel={() => setShowAddLedgerModal('')}
          />
        );
      case 'add new wic':
        return (
          <WalkInCustomerForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setShowAddLedgerModal('');
            }}
            onCancel={() => setShowAddLedgerModal('')}
          />
        );
      case 'add new gl':
        return (
          <ChartOfAccountForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setShowAddLedgerModal('');
            }}
            onCancel={() => setShowAddLedgerModal('')}
          />
        );
      case 'add new br':
        return (
          <BeneficiaryRegisterForm
            inPopup
            onSuccess={(newlyCreatedAccount) => {
              setShowAddLedgerModal('');
            }}
            onCancel={() => setShowAddLedgerModal('')}
          />
        );
      default:
        break;
    }
  };
  <CustomModal
    show={!!showAddLedgerModal}
    close={() => setShowAddLedgerModal('')}
    size="xl"
    style={{ minHeight: '812px' }}
  >
    {renderAddLedgerForm()}
  </CustomModal>;
}
//////// Popup Ledgers End ////////
//
//
//
//
//
//
// --- Basic Form --- //
{
  <Formik
    initialValues={{
      customer_name: '',
      id_type: '',
      mobile_number: '',
    }}
    onSubmit={handleSubmit}
  >
    {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
      <Form>
        <div className="row mb-4">
          {/* Simple Input */}
          <div className="col-12 col-sm-6 mb-3">
            <CustomInput
              name={'customer_name'}
              type={'text'}
              required
              label={'Customer Name'}
              placeholder={'Enter Customer Name'}
              value={values.customer_name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.customer_name && errors.customer_name}
            />
          </div>
          {/* Dropdown Input */}
          <div className="col-12 col-sm-6 mb-45">
            <SearchableSelect
              label={'ID Type'}
              name="id_type"
              options={getIDTypesOptions()}
              required
              value={values.id_type}
              onChange={(v) => {
                setFieldValue('id_type', v.value);
              }}
              placeholder={'Select ID Type'}
            />
            <ErrorMessage
              name="id_type"
              component="div"
              className="input-error-message text-danger"
            />
          </div>
          {/* Phone Input */}
          <div className="col-12 col-sm-6 mb-45 inputWrapper">
            <label className="mainLabel">
              Mobile Number
              <span className="text-danger">*</span>
            </label>
            <FastField name="mobile_number">
              {({ field }) => (
                <PhoneInput
                  {...field}
                  international
                  withCountryCallingCode
                  placeholder="Enter phone number"
                  className="mainInput"
                  defaultCountry="US"
                  // value={values.mobile_number}
                  onChange={(value) => {
                    setFieldValue('mobile_number', value);
                  }}
                  onBlur={() =>
                    handleBlur({ target: { name: 'mobile_number' } })
                  }
                />
              )}
            </FastField>
            <ErrorMessage
              name="mobile_number"
              component="div"
              className="input-error-message text-danger"
            />{' '}
          </div>
        </div>
        <div className="d-flex gap-3 ms-auto mb-3 mb-md-0">
          <CustomButton
            // loading={editWalkInCustomerMutation.isPending}
            // disabled={editWalkInCustomerMutation.isPending}
            type={'submit'}
            text={'Update'}
          />
          {/* {!editWalkInCustomerMutation.isPending && ( */}
          <CustomButton
            variant={'secondaryButton'}
            text={'Cancel'}
            type={'button'}
            onClick={() => navigate(-1)}
          />
          {/* )} */}
        </div>
      </Form>
    )}
  </Formik>;
}
//////// Basic Form End ////////
//
//
//
//
//
//
// --- Attachments Modal --- //
{
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);

  <CustomModal
    show={showAttachmentsModal}
    close={() => setShowAttachmentsModal(false)}
    background={true}
  >
    <AttachmentsView
      item={supportLogsData[0]}
      queryToInvalidate={'attachmentsss'}
      // deleteService={deleteDocumentRegisterAttachment}
      // uploadService={addDocumentRegisterAttachment}
      closeUploader={setShowAttachmentsModal}
    />
  </CustomModal>;
}
//////// Attachments Modal End ////////
//
//
//
//
//
//
