# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useInsertAllocations, useUpsertAllocations, useInsertBillabilityRuleConditions, useUpsertBillabilityRuleConditions, useInsertBillabilityRules, useUpsertBillabilityRules, useInsertClientTeamAllocations, useUpsertClientTeamAllocations, useInsertDailyAllocations, useUpsertDailyAllocations } from '@dataconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useInsertAllocations(insertAllocationsVars);

const { data, isPending, isSuccess, isError, error } = useUpsertAllocations(upsertAllocationsVars);

const { data, isPending, isSuccess, isError, error } = useInsertBillabilityRuleConditions(insertBillabilityRuleConditionsVars);

const { data, isPending, isSuccess, isError, error } = useUpsertBillabilityRuleConditions(upsertBillabilityRuleConditionsVars);

const { data, isPending, isSuccess, isError, error } = useInsertBillabilityRules(insertBillabilityRulesVars);

const { data, isPending, isSuccess, isError, error } = useUpsertBillabilityRules(upsertBillabilityRulesVars);

const { data, isPending, isSuccess, isError, error } = useInsertClientTeamAllocations(insertClientTeamAllocationsVars);

const { data, isPending, isSuccess, isError, error } = useUpsertClientTeamAllocations(upsertClientTeamAllocationsVars);

const { data, isPending, isSuccess, isError, error } = useInsertDailyAllocations(insertDailyAllocationsVars);

const { data, isPending, isSuccess, isError, error } = useUpsertDailyAllocations(upsertDailyAllocationsVars);

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { insertAllocations, upsertAllocations, insertBillabilityRuleConditions, upsertBillabilityRuleConditions, insertBillabilityRules, upsertBillabilityRules, insertClientTeamAllocations, upsertClientTeamAllocations, insertDailyAllocations, upsertDailyAllocations } from '@dataconnect/generated';


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