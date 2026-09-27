const { request } = require('./apiClient');

// Public aggregates are independent of the authorized detail/dashboard scope.
module.exports.getPublicRankings = ({year, quarters, member_id}) => request({
  path: `/dashboard/rankings?ranking_scope=department_sales&personal=true&year=${encodeURIComponent(year)}&${quarters.map(q => 'quarters=' + encodeURIComponent(q)).join('&')}&member_id=${encodeURIComponent(member_id)}`,
});
