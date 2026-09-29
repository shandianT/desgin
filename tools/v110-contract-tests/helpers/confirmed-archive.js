// Test fixture for upstream post-confirmation behavior. The separate AMT-02
// suite exercises issuance, mutation binding, rejection and consumption of tickets.
module.exports=function submitConfirmed(page,session={userId:'u',workspaceId:'w'}){
 const writes=require('../../miniprogram/utils/pageWriteContext').createPageWriteContext(()=>session);
 const ticket=writes.begin(page,'archiveConfirm',()=>page.data.reviewRunId);if(!ticket)return;
 ticket.start();const result=page.submitArchive(undefined,ticket);ticket.finish();return result;
};
