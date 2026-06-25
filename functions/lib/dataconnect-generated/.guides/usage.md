# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { insertAllocations, upsertAllocations, insertBillabilityRuleConditions, upsertBillabilityRuleConditions, insertBillabilityRules, upsertBillabilityRules, insertClientTeamAllocations, upsertClientTeamAllocations, insertDailyAllocations, upsertDailyAllocations } from '@dataconnect/generated-server';


// Operation InsertAllocations:  For variables, look at type InsertAllocationsVars in ../index.d.ts
const { data } = await InsertAllocations(dataConnect, insertAllocationsVars);

// Operation UpsertAllocations:  For variables, look at type UpsertAllocationsVars in ../index.d.ts
const { data } = await UpsertAllocations(dataConnect, upsertAllocationsVars);

// Operation InsertBillabilityRuleConditions:  For variables, look at type InsertBillabilityRuleConditionsVars in ../index.d.ts
const { data } = await InsertBillabilityRuleConditions(dataConnect, insertBillabilityRuleConditionsVars);

// Operation UpsertBillabilityRuleConditions:  For variables, look at type UpsertBillabilityRuleConditionsVars in ../index.d.ts
const { data } = await UpsertBillabilityRuleConditions(dataConnect, upsertBillabilityRuleConditionsVars);

// Operation InsertBillabilityRules:  For variables, look at type InsertBillabilityRulesVars in ../index.d.ts
const { data } = await InsertBillabilityRules(dataConnect, insertBillabilityRulesVars);

// Operation UpsertBillabilityRules:  For variables, look at type UpsertBillabilityRulesVars in ../index.d.ts
const { data } = await UpsertBillabilityRules(dataConnect, upsertBillabilityRulesVars);

// Operation InsertClientTeamAllocations:  For variables, look at type InsertClientTeamAllocationsVars in ../index.d.ts
const { data } = await InsertClientTeamAllocations(dataConnect, insertClientTeamAllocationsVars);

// Operation UpsertClientTeamAllocations:  For variables, look at type UpsertClientTeamAllocationsVars in ../index.d.ts
const { data } = await UpsertClientTeamAllocations(dataConnect, upsertClientTeamAllocationsVars);

// Operation InsertDailyAllocations:  For variables, look at type InsertDailyAllocationsVars in ../index.d.ts
const { data } = await InsertDailyAllocations(dataConnect, insertDailyAllocationsVars);

// Operation UpsertDailyAllocations:  For variables, look at type UpsertDailyAllocationsVars in ../index.d.ts
const { data } = await UpsertDailyAllocations(dataConnect, upsertDailyAllocationsVars);


```