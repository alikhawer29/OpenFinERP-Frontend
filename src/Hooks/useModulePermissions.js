import { useMemo } from 'react';
import useUserStore from '../Stores/UserStore';
export const useModulePermissions = (parent, module) => {
  const { hasPermission, hasFeaturePermission } = useUserStore();

  return useMemo(() => {
    const normalizedModule = module?.toLowerCase() || '';
    
    if (!parent || !module) {
      return {
        view: false,
        create: false,
        edit: false,
        delete: false,
        print: false,
        hasAccess: false,
        accessKey: 'noAccess',
        create_single_deal: false,
        create_multiple_deals: false,
        pay: false,
        back_to_back_entry: false,
        post: false,
        cancel_posting: false,
      };
    }

    // Check all standard permissions
    const view = hasPermission(parent, module, 'view');
    const create = hasPermission(parent, module, 'create');
    const edit = hasPermission(parent, module, 'edit');
    const deletePermission = hasPermission(parent, module, 'delete');
    const print = hasPermission(parent, module, 'print');
    
  


    // Check module-specific permissions for foreign_currency_deal
    const create_single_deal = normalizedModule === 'foreign_currency_deal' 
      ? hasPermission(parent, module, 'create_single_deal')
      : false;
    const create_multiple_deals = normalizedModule === 'foreign_currency_deal'
      ? hasPermission(parent, module, 'create_multiple_deals')
      : false;

    // Check module-specific permissions for inward_payment
    const pay = normalizedModule === 'inward_payment'
      ? hasPermission(parent, module, 'pay')
      : false;

    // Check module-specific permissions for outward_remittance
    const back_to_back_entry = normalizedModule === 'outward_remittance'
      ? hasPermission(parent, module, 'back_to_back_entry')
      : false;

    // Check module-specific permissions for outward_remittance_register
    const outwardRemittanceRegisterPost = normalizedModule === 'outward_remittance_register'
      ? hasPermission(parent, module, 'post')
      : false;

    // Check module-specific permissions for suspense_posting
    const suspensePostingPost = normalizedModule === 'suspense_posting'
      ? hasPermission(parent, module, 'post')
      : false;
    const cancel_posting = normalizedModule === 'suspense_posting'
      ? hasPermission(parent, module, 'cancel_posting')
      : false;

    // Combine post permissions for both modules
    const post = outwardRemittanceRegisterPost || suspensePostingPost;

    // Check if user has any permission at all
    const hasAccess = hasFeaturePermission(parent, module);

    // Determine access key
    const accessKey = hasAccess ? 'hasAccess' : 'noAccess';

    // PDC payment process
    const settled = hasPermission(parent, module, 'settle');
    const revert = hasPermission(parent, module, 'revert');
    const return_unpaid = hasPermission(parent, module, 'return_unpaid');

    // Profit and loss process
    const re_calculate_closing_rate = hasPermission(parent, module, 're_calculate_closing_rate')
    const rate_revaluation = hasPermission(parent, module, 'rate_revaluation')
    const profit_loss_balance_conversion = hasPermission(parent, module, 'profit_loss_balance_conversion')
    const profit_loss_posting = hasPermission(parent, module, 'profit_loss_posting')
    const profit_and_loss_print = hasPermission(parent, module, 'print')
    
    // budget setup
    const create_budget = hasPermission(parent, module, 'create_budget')
    const edit_budget = hasPermission(parent, module, 'edit_budget')

    // journal report
    const allowToExcel = hasPermission(parent, module, 'export_to_excel')
    const allowToPdf = hasPermission(parent, module, 'export_to_pdf')

    // budget forcasting report
    const createProjection = hasPermission(parent, module, 'create_projection')
    const editProjection = hasPermission(parent, module, 'edit_projection')
   
    // statement of account report
    const emailAsPdf = hasPermission(parent, module, 'email_as_excel')
    const emailAsExcel = hasPermission(parent, module, 'email_as_pdf')

    // statement of account report
    const blockUnblock = hasPermission(parent, module, 'block_unblock')
    
    // branch selection
    const gitex = hasPermission(parent, module, 'Gitex Dubai')
    const silicon = hasPermission(parent, module, 'Silicon Valley')

    // subscribtion logs
    const buy_custom_subscription = hasPermission(parent, module, 'buy_custom_subscription')
    const change_subscription = hasPermission(parent, module, 'change_subscription')
    const renew_subscription = hasPermission(parent, module, 'renew_subscription')
    const request_custom_subscription = hasPermission(parent, module, 'request_custom_subscription')
    const view_subscription_logs = hasPermission(parent, module, 'view_subscription_logs')
    const cancel_subscription = hasPermission(parent, module, 'cancel_subscription')
  
    // cheque register
    const create_cheque_book = hasPermission(parent, module, 'create_cheque_book')
    const delete_cheque_book = hasPermission(parent, module, 'delete_cheque_book')
    const delete_single_cheque = hasPermission(parent, module, 'delete_single_cheque')

    return {
      view,
      create,
      edit,
      delete: deletePermission,
      print,
      hasAccess,
      accessKey,
      create_single_deal,
      create_multiple_deals,
      pay,
      back_to_back_entry,
      post,
      cancel_posting,
      settled, 
      revert,
      return_unpaid,
      re_calculate_closing_rate,
      rate_revaluation,
      profit_loss_balance_conversion,
      profit_loss_posting,
      profit_and_loss_print,
      create_budget,
      edit_budget,
      allowToExcel,
      allowToPdf,
      createProjection,
      editProjection,
      emailAsPdf,
      emailAsExcel,
      blockUnblock,
      gitex,
      silicon,
      buy_custom_subscription,
      change_subscription,
      renew_subscription,
      request_custom_subscription,
      view_subscription_logs,
      cancel_subscription,
      create_cheque_book,
      delete_cheque_book,
      delete_single_cheque
    };
  }, [parent, module, hasPermission, hasFeaturePermission]);
};

export default useModulePermissions;

