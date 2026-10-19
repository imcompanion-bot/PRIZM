const fs = require('fs');
const file = 'src/components/analytics/ClientFinancialsWidget.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetBody = `                <tbody>
                  {displayData.fullTable.map((row, i) => {
                    const isOthers = row.client === "Others";
                    let changeStr = "n/a - new client";
                    let changeColor = "text-stone-500";
                    if (row.priorVal > 0) {
                      const pct = Math.round(((row.activeVal - row.priorVal) / row.priorVal) * 100);
                      changeStr = pct > 0 ? \`+\${pct}%\` : \`\${pct}%\`;
                      changeColor = pct > 0 ? "text-emerald-600 font-medium" : pct < 0 ? "text-rose-600 font-medium" : "text-stone-600";
                    } else if (row.priorVal === 0 && row.activeVal === 0) {
                      changeStr = "-";
                    }

                    return (
                      <tr key={row.client} className={\`border-b border-stone-100 \${isOthers ? "bg-stone-50/50" : ""}\`}>
                        <td className={\`py-2 px-3 \${isOthers ? 'italic text-stone-600' : 'font-medium text-stone-800'}\`}>
                          {row.client}
                        </td>
                        <td className="text-right py-2 px-3 tabular-nums font-medium">
                          {row.activeVal === 0 ? "-" : formatCurrencyCompact(row.activeVal, displayCurrency)}
                        </td>
                        <td className={\`text-right py-2 px-3 \${changeColor} whitespace-nowrap\`}>
                          {changeStr}
                        </td>
                        <td className="text-right py-2 px-3 tabular-nums text-stone-600">
                          {row.priorVal === 0 ? "-" : formatCurrencyCompact(row.priorVal, displayCurrency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>`;

const newBody = `                <tbody>
                  {displayData.fullTable.map((row, i) => {
                    const isOthers = row.client === "Others";
                    let changeStr = "n/a - new client";
                    let changeColor = "text-stone-500";
                    if (row.priorVal > 0) {
                      const pct = Math.round(((row.activeVal - row.priorVal) / row.priorVal) * 100);
                      changeStr = pct > 0 ? \`+\${pct}%\` : \`\${pct}%\`;
                      changeColor = pct > 0 ? "text-emerald-600 font-medium" : pct < 0 ? "text-rose-600 font-medium" : "text-stone-600";
                    } else if (row.priorVal === 0 && row.activeVal === 0) {
                      changeStr = "-";
                    }

                    const rowContent = (
                      <tr 
                        key={row.client} 
                        className={\`border-b border-stone-100 \${isOthers ? "bg-stone-50/50 cursor-pointer hover:bg-stone-100 transition-colors" : ""}\`}
                        onClick={() => isOthers && setIsOthersExpanded(!isOthersExpanded)}
                      >
                        <td className={\`py-2 px-3 \${isOthers ? 'italic text-stone-600 flex items-center gap-1' : 'font-medium text-stone-800'}\`}>
                          {isOthers && (
                            isOthersExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                          )}
                          {row.client}
                        </td>
                        <td className="text-right py-2 px-3 tabular-nums font-medium">
                          {row.activeVal === 0 ? "-" : formatCurrencyCompact(row.activeVal, displayCurrency)}
                        </td>
                        <td className={\`text-right py-2 px-3 \${changeColor} whitespace-nowrap\`}>
                          {changeStr}
                        </td>
                        <td className="text-right py-2 px-3 tabular-nums text-stone-600">
                          {row.priorVal === 0 ? "-" : formatCurrencyCompact(row.priorVal, displayCurrency)}
                        </td>
                      </tr>
                    );

                    if (!isOthers || !isOthersExpanded) return rowContent;

                    return (
                      <React.Fragment key="others-group">
                        {rowContent}
                        {displayData.othersList.map(subRow => {
                          let subChangeStr = "n/a - new client";
                          let subChangeColor = "text-stone-500";
                          if (subRow.priorVal > 0) {
                            const pct = Math.round(((subRow.activeVal - subRow.priorVal) / subRow.priorVal) * 100);
                            subChangeStr = pct > 0 ? \`+\${pct}%\` : \`\${pct}%\`;
                            subChangeColor = pct > 0 ? "text-emerald-600" : pct < 0 ? "text-rose-600" : "text-stone-500";
                          } else if (subRow.priorVal === 0 && subRow.activeVal === 0) {
                            subChangeStr = "-";
                          }
                          
                          return (
                            <tr key={subRow.client} className="border-b border-stone-100/50 bg-stone-50/20 text-xs">
                              <td className="py-1.5 px-3 pl-8 text-stone-600 truncate max-w-[150px]">
                                {subRow.client}
                              </td>
                              <td className="text-right py-1.5 px-3 tabular-nums">
                                {subRow.activeVal === 0 ? "-" : formatCurrencyCompact(subRow.activeVal, displayCurrency)}
                              </td>
                              <td className={\`text-right py-1.5 px-3 \${subChangeColor} whitespace-nowrap\`}>
                                {subChangeStr}
                              </td>
                              <td className="text-right py-1.5 px-3 tabular-nums text-stone-500">
                                {subRow.priorVal === 0 ? "-" : formatCurrencyCompact(subRow.priorVal, displayCurrency)}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>`;

content = content.replace(targetBody, newBody);
content = content.replace('import { useState, useMemo } from "react";', 'import React, { useState, useMemo } from "react";');

fs.writeFileSync(file, content);
console.log("Applied UI changes");
