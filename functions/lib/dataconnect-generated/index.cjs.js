const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs, makeMemoryCacheProvider } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'projectzen',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;
const dataConnectSettings = {
  cacheSettings: {
    cacheProvider: makeMemoryCacheProvider()
  }
};
exports.dataConnectSettings = dataConnectSettings;

const insertAllocationsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertAllocations', inputVars);
}
insertAllocationsRef.operationName = 'InsertAllocations';
exports.insertAllocationsRef = insertAllocationsRef;

exports.insertAllocations = function insertAllocations(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertAllocationsRef(dcInstance, inputVars));
}
;

const upsertAllocationsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertAllocations', inputVars);
}
upsertAllocationsRef.operationName = 'UpsertAllocations';
exports.upsertAllocationsRef = upsertAllocationsRef;

exports.upsertAllocations = function upsertAllocations(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertAllocationsRef(dcInstance, inputVars));
}
;

const insertBillabilityRuleConditionsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertBillabilityRuleConditions', inputVars);
}
insertBillabilityRuleConditionsRef.operationName = 'InsertBillabilityRuleConditions';
exports.insertBillabilityRuleConditionsRef = insertBillabilityRuleConditionsRef;

exports.insertBillabilityRuleConditions = function insertBillabilityRuleConditions(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertBillabilityRuleConditionsRef(dcInstance, inputVars));
}
;

const upsertBillabilityRuleConditionsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertBillabilityRuleConditions', inputVars);
}
upsertBillabilityRuleConditionsRef.operationName = 'UpsertBillabilityRuleConditions';
exports.upsertBillabilityRuleConditionsRef = upsertBillabilityRuleConditionsRef;

exports.upsertBillabilityRuleConditions = function upsertBillabilityRuleConditions(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertBillabilityRuleConditionsRef(dcInstance, inputVars));
}
;

const insertBillabilityRulesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertBillabilityRules', inputVars);
}
insertBillabilityRulesRef.operationName = 'InsertBillabilityRules';
exports.insertBillabilityRulesRef = insertBillabilityRulesRef;

exports.insertBillabilityRules = function insertBillabilityRules(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertBillabilityRulesRef(dcInstance, inputVars));
}
;

const upsertBillabilityRulesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertBillabilityRules', inputVars);
}
upsertBillabilityRulesRef.operationName = 'UpsertBillabilityRules';
exports.upsertBillabilityRulesRef = upsertBillabilityRulesRef;

exports.upsertBillabilityRules = function upsertBillabilityRules(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertBillabilityRulesRef(dcInstance, inputVars));
}
;

const insertClientTeamAllocationsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertClientTeamAllocations', inputVars);
}
insertClientTeamAllocationsRef.operationName = 'InsertClientTeamAllocations';
exports.insertClientTeamAllocationsRef = insertClientTeamAllocationsRef;

exports.insertClientTeamAllocations = function insertClientTeamAllocations(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertClientTeamAllocationsRef(dcInstance, inputVars));
}
;

const upsertClientTeamAllocationsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertClientTeamAllocations', inputVars);
}
upsertClientTeamAllocationsRef.operationName = 'UpsertClientTeamAllocations';
exports.upsertClientTeamAllocationsRef = upsertClientTeamAllocationsRef;

exports.upsertClientTeamAllocations = function upsertClientTeamAllocations(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertClientTeamAllocationsRef(dcInstance, inputVars));
}
;

const insertDailyAllocationsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertDailyAllocations', inputVars);
}
insertDailyAllocationsRef.operationName = 'InsertDailyAllocations';
exports.insertDailyAllocationsRef = insertDailyAllocationsRef;

exports.insertDailyAllocations = function insertDailyAllocations(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertDailyAllocationsRef(dcInstance, inputVars));
}
;

const upsertDailyAllocationsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertDailyAllocations', inputVars);
}
upsertDailyAllocationsRef.operationName = 'UpsertDailyAllocations';
exports.upsertDailyAllocationsRef = upsertDailyAllocationsRef;

exports.upsertDailyAllocations = function upsertDailyAllocations(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertDailyAllocationsRef(dcInstance, inputVars));
}
;

const insertDataImportsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertDataImports', inputVars);
}
insertDataImportsRef.operationName = 'InsertDataImports';
exports.insertDataImportsRef = insertDataImportsRef;

exports.insertDataImports = function insertDataImports(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertDataImportsRef(dcInstance, inputVars));
}
;

const upsertDataImportsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertDataImports', inputVars);
}
upsertDataImportsRef.operationName = 'UpsertDataImports';
exports.upsertDataImportsRef = upsertDataImportsRef;

exports.upsertDataImports = function upsertDataImports(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertDataImportsRef(dcInstance, inputVars));
}
;

const insertPeopleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertPeople', inputVars);
}
insertPeopleRef.operationName = 'InsertPeople';
exports.insertPeopleRef = insertPeopleRef;

exports.insertPeople = function insertPeople(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertPeopleRef(dcInstance, inputVars));
}
;

const upsertPeopleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertPeople', inputVars);
}
upsertPeopleRef.operationName = 'UpsertPeople';
exports.upsertPeopleRef = upsertPeopleRef;

exports.upsertPeople = function upsertPeople(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertPeopleRef(dcInstance, inputVars));
}
;

const insertPhaseAllocationsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertPhaseAllocations', inputVars);
}
insertPhaseAllocationsRef.operationName = 'InsertPhaseAllocations';
exports.insertPhaseAllocationsRef = insertPhaseAllocationsRef;

exports.insertPhaseAllocations = function insertPhaseAllocations(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertPhaseAllocationsRef(dcInstance, inputVars));
}
;

const upsertPhaseAllocationsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertPhaseAllocations', inputVars);
}
upsertPhaseAllocationsRef.operationName = 'UpsertPhaseAllocations';
exports.upsertPhaseAllocationsRef = upsertPhaseAllocationsRef;

exports.upsertPhaseAllocations = function upsertPhaseAllocations(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertPhaseAllocationsRef(dcInstance, inputVars));
}
;

const insertProjectMonthlyRevenueRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertProjectMonthlyRevenue', inputVars);
}
insertProjectMonthlyRevenueRef.operationName = 'InsertProjectMonthlyRevenue';
exports.insertProjectMonthlyRevenueRef = insertProjectMonthlyRevenueRef;

exports.insertProjectMonthlyRevenue = function insertProjectMonthlyRevenue(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertProjectMonthlyRevenueRef(dcInstance, inputVars));
}
;

const upsertProjectMonthlyRevenueRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertProjectMonthlyRevenue', inputVars);
}
upsertProjectMonthlyRevenueRef.operationName = 'UpsertProjectMonthlyRevenue';
exports.upsertProjectMonthlyRevenueRef = upsertProjectMonthlyRevenueRef;

exports.upsertProjectMonthlyRevenue = function upsertProjectMonthlyRevenue(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertProjectMonthlyRevenueRef(dcInstance, inputVars));
}
;

const insertProjectPhasesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertProjectPhases', inputVars);
}
insertProjectPhasesRef.operationName = 'InsertProjectPhases';
exports.insertProjectPhasesRef = insertProjectPhasesRef;

exports.insertProjectPhases = function insertProjectPhases(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertProjectPhasesRef(dcInstance, inputVars));
}
;

const upsertProjectPhasesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertProjectPhases', inputVars);
}
upsertProjectPhasesRef.operationName = 'UpsertProjectPhases';
exports.upsertProjectPhasesRef = upsertProjectPhasesRef;

exports.upsertProjectPhases = function upsertProjectPhases(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertProjectPhasesRef(dcInstance, inputVars));
}
;

const insertProjectScopesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertProjectScopes', inputVars);
}
insertProjectScopesRef.operationName = 'InsertProjectScopes';
exports.insertProjectScopesRef = insertProjectScopesRef;

exports.insertProjectScopes = function insertProjectScopes(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertProjectScopesRef(dcInstance, inputVars));
}
;

const upsertProjectScopesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertProjectScopes', inputVars);
}
upsertProjectScopesRef.operationName = 'UpsertProjectScopes';
exports.upsertProjectScopesRef = upsertProjectScopesRef;

exports.upsertProjectScopes = function upsertProjectScopes(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertProjectScopesRef(dcInstance, inputVars));
}
;

const insertProjectsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertProjects', inputVars);
}
insertProjectsRef.operationName = 'InsertProjects';
exports.insertProjectsRef = insertProjectsRef;

exports.insertProjects = function insertProjects(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertProjectsRef(dcInstance, inputVars));
}
;

const upsertProjectsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertProjects', inputVars);
}
upsertProjectsRef.operationName = 'UpsertProjects';
exports.upsertProjectsRef = upsertProjectsRef;

exports.upsertProjects = function upsertProjects(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertProjectsRef(dcInstance, inputVars));
}
;

const insertRateCardsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertRateCards', inputVars);
}
insertRateCardsRef.operationName = 'InsertRateCards';
exports.insertRateCardsRef = insertRateCardsRef;

exports.insertRateCards = function insertRateCards(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertRateCardsRef(dcInstance, inputVars));
}
;

const upsertRateCardsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertRateCards', inputVars);
}
upsertRateCardsRef.operationName = 'UpsertRateCards';
exports.upsertRateCardsRef = upsertRateCardsRef;

exports.upsertRateCards = function upsertRateCards(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertRateCardsRef(dcInstance, inputVars));
}
;

const insertRolesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertRoles', inputVars);
}
insertRolesRef.operationName = 'InsertRoles';
exports.insertRolesRef = insertRolesRef;

exports.insertRoles = function insertRoles(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertRolesRef(dcInstance, inputVars));
}
;

const upsertRolesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertRoles', inputVars);
}
upsertRolesRef.operationName = 'UpsertRoles';
exports.upsertRolesRef = upsertRolesRef;

exports.upsertRoles = function upsertRoles(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertRolesRef(dcInstance, inputVars));
}
;

const insertTimeEntriesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertTimeEntries', inputVars);
}
insertTimeEntriesRef.operationName = 'InsertTimeEntries';
exports.insertTimeEntriesRef = insertTimeEntriesRef;

exports.insertTimeEntries = function insertTimeEntries(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(insertTimeEntriesRef(dcInstance, inputVars));
}
;

const upsertTimeEntriesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertTimeEntries', inputVars);
}
upsertTimeEntriesRef.operationName = 'UpsertTimeEntries';
exports.upsertTimeEntriesRef = upsertTimeEntriesRef;

exports.upsertTimeEntries = function upsertTimeEntries(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertTimeEntriesRef(dcInstance, inputVars));
}
;

const createAppUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateAppUser', inputVars);
}
createAppUserRef.operationName = 'CreateAppUser';
exports.createAppUserRef = createAppUserRef;

exports.createAppUser = function createAppUser(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createAppUserRef(dcInstance, inputVars));
}
;

const updateAppUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateAppUser', inputVars);
}
updateAppUserRef.operationName = 'UpdateAppUser';
exports.updateAppUserRef = updateAppUserRef;

exports.updateAppUser = function updateAppUser(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateAppUserRef(dcInstance, inputVars));
}
;

const deleteAppUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteAppUser', inputVars);
}
deleteAppUserRef.operationName = 'DeleteAppUser';
exports.deleteAppUserRef = deleteAppUserRef;

exports.deleteAppUser = function deleteAppUser(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteAppUserRef(dcInstance, inputVars));
}
;

const deleteTimeEntriesByDateRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteTimeEntriesByDate', inputVars);
}
deleteTimeEntriesByDateRef.operationName = 'DeleteTimeEntriesByDate';
exports.deleteTimeEntriesByDateRef = deleteTimeEntriesByDateRef;

exports.deleteTimeEntriesByDate = function deleteTimeEntriesByDate(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteTimeEntriesByDateRef(dcInstance, inputVars));
}
;

const deleteAllTimeEntriesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteAllTimeEntries');
}
deleteAllTimeEntriesRef.operationName = 'DeleteAllTimeEntries';
exports.deleteAllTimeEntriesRef = deleteAllTimeEntriesRef;

exports.deleteAllTimeEntries = function deleteAllTimeEntries(dc) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dc, undefined);
  return executeMutation(deleteAllTimeEntriesRef(dcInstance, inputVars));
}
;

const deleteBillabilityRulesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteBillabilityRules', inputVars);
}
deleteBillabilityRulesRef.operationName = 'DeleteBillabilityRules';
exports.deleteBillabilityRulesRef = deleteBillabilityRulesRef;

exports.deleteBillabilityRules = function deleteBillabilityRules(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteBillabilityRulesRef(dcInstance, inputVars));
}
;

const deleteBillabilityRuleConditionsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteBillabilityRuleConditions', inputVars);
}
deleteBillabilityRuleConditionsRef.operationName = 'DeleteBillabilityRuleConditions';
exports.deleteBillabilityRuleConditionsRef = deleteBillabilityRuleConditionsRef;

exports.deleteBillabilityRuleConditions = function deleteBillabilityRuleConditions(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteBillabilityRuleConditionsRef(dcInstance, inputVars));
}
;

const deleteBillabilityRuleConditionsByRuleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteBillabilityRuleConditionsByRule', inputVars);
}
deleteBillabilityRuleConditionsByRuleRef.operationName = 'DeleteBillabilityRuleConditionsByRule';
exports.deleteBillabilityRuleConditionsByRuleRef = deleteBillabilityRuleConditionsByRuleRef;

exports.deleteBillabilityRuleConditionsByRule = function deleteBillabilityRuleConditionsByRule(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteBillabilityRuleConditionsByRuleRef(dcInstance, inputVars));
}
;

const deletePeopleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeletePeople', inputVars);
}
deletePeopleRef.operationName = 'DeletePeople';
exports.deletePeopleRef = deletePeopleRef;

exports.deletePeople = function deletePeople(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deletePeopleRef(dcInstance, inputVars));
}
;

const updateTimeEntryPersonRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateTimeEntryPerson', inputVars);
}
updateTimeEntryPersonRef.operationName = 'UpdateTimeEntryPerson';
exports.updateTimeEntryPersonRef = updateTimeEntryPersonRef;

exports.updateTimeEntryPerson = function updateTimeEntryPerson(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateTimeEntryPersonRef(dcInstance, inputVars));
}
;

const listProjectsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListProjects');
}
listProjectsRef.operationName = 'ListProjects';
exports.listProjectsRef = listProjectsRef;

exports.listProjects = function listProjects(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listProjectsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getProjectRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetProject', inputVars);
}
getProjectRef.operationName = 'GetProject';
exports.getProjectRef = getProjectRef;

exports.getProject = function getProject(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getProjectRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listPeopleRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPeople');
}
listPeopleRef.operationName = 'ListPeople';
exports.listPeopleRef = listPeopleRef;

exports.listPeople = function listPeople(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listPeopleRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listRolesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListRoles');
}
listRolesRef.operationName = 'ListRoles';
exports.listRolesRef = listRolesRef;

exports.listRoles = function listRoles(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listRolesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listRateCardsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListRateCards');
}
listRateCardsRef.operationName = 'ListRateCards';
exports.listRateCardsRef = listRateCardsRef;

exports.listRateCards = function listRateCards(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listRateCardsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listTimeEntriesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListTimeEntries');
}
listTimeEntriesRef.operationName = 'ListTimeEntries';
exports.listTimeEntriesRef = listTimeEntriesRef;

exports.listTimeEntries = function listTimeEntries(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listTimeEntriesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listTimeEntriesByProjectRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListTimeEntriesByProject', inputVars);
}
listTimeEntriesByProjectRef.operationName = 'ListTimeEntriesByProject';
exports.listTimeEntriesByProjectRef = listTimeEntriesByProjectRef;

exports.listTimeEntriesByProject = function listTimeEntriesByProject(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listTimeEntriesByProjectRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listProjectPhasesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListProjectPhases');
}
listProjectPhasesRef.operationName = 'ListProjectPhases';
exports.listProjectPhasesRef = listProjectPhasesRef;

exports.listProjectPhases = function listProjectPhases(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listProjectPhasesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listAllocationsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAllocations');
}
listAllocationsRef.operationName = 'ListAllocations';
exports.listAllocationsRef = listAllocationsRef;

exports.listAllocations = function listAllocations(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listAllocationsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listDataImportsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListDataImports');
}
listDataImportsRef.operationName = 'ListDataImports';
exports.listDataImportsRef = listDataImportsRef;

exports.listDataImports = function listDataImports(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listDataImportsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getAppUserByEmailRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAppUserByEmail', inputVars);
}
getAppUserByEmailRef.operationName = 'GetAppUserByEmail';
exports.getAppUserByEmailRef = getAppUserByEmailRef;

exports.getAppUserByEmail = function getAppUserByEmail(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getAppUserByEmailRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listAppUsersRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAppUsers');
}
listAppUsersRef.operationName = 'ListAppUsers';
exports.listAppUsersRef = listAppUsersRef;

exports.listAppUsers = function listAppUsers(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listAppUsersRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getOldestTimeEntryRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetOldestTimeEntry');
}
getOldestTimeEntryRef.operationName = 'GetOldestTimeEntry';
exports.getOldestTimeEntryRef = getOldestTimeEntryRef;

exports.getOldestTimeEntry = function getOldestTimeEntry(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getOldestTimeEntryRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getNewestTimeEntryRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetNewestTimeEntry');
}
getNewestTimeEntryRef.operationName = 'GetNewestTimeEntry';
exports.getNewestTimeEntryRef = getNewestTimeEntryRef;

exports.getNewestTimeEntry = function getNewestTimeEntry(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getNewestTimeEntryRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getTimeEntriesByDateRangeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetTimeEntriesByDateRange', inputVars);
}
getTimeEntriesByDateRangeRef.operationName = 'GetTimeEntriesByDateRange';
exports.getTimeEntriesByDateRangeRef = getTimeEntriesByDateRangeRef;

exports.getTimeEntriesByDateRange = function getTimeEntriesByDateRange(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getTimeEntriesByDateRangeRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getAllTimeEntriesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAllTimeEntries');
}
getAllTimeEntriesRef.operationName = 'GetAllTimeEntries';
exports.getAllTimeEntriesRef = getAllTimeEntriesRef;

exports.getAllTimeEntries = function getAllTimeEntries(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getAllTimeEntriesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listProjectScopesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListProjectScopes');
}
listProjectScopesRef.operationName = 'ListProjectScopes';
exports.listProjectScopesRef = listProjectScopesRef;

exports.listProjectScopes = function listProjectScopes(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listProjectScopesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listBillabilityRulesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListBillabilityRules');
}
listBillabilityRulesRef.operationName = 'ListBillabilityRules';
exports.listBillabilityRulesRef = listBillabilityRulesRef;

exports.listBillabilityRules = function listBillabilityRules(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listBillabilityRulesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listBillabilityRuleConditionsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListBillabilityRuleConditions');
}
listBillabilityRuleConditionsRef.operationName = 'ListBillabilityRuleConditions';
exports.listBillabilityRuleConditionsRef = listBillabilityRuleConditionsRef;

exports.listBillabilityRuleConditions = function listBillabilityRuleConditions(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listBillabilityRuleConditionsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;
