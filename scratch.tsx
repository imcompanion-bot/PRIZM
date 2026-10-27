      {/* Rules Section */}
      <div className="mt-8 border rounded-lg bg-slate-50 overflow-hidden">
        <button 
          onClick={() => setShowRules(!showRules)}
          className="w-full flex items-center justify-between p-4 font-medium text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-slate-500" />
            What gets flagged?
          </div>
          {showRules ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        
        {showRules && (
          <div className="p-4 pt-0 text-sm text-slate-600 border-t bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Financial & Margin Flags</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Standard Projects:</strong> Gross Profit Margin is outside the typical 20% - 60% range.</li>
                  <li><strong>Passthrough Costs:</strong> Margin should be exactly 0%.</li>
                  <li><strong>RTB & Talent Savings:</strong> Margin should be 100%.</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Pipeline & Dates</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Stale Pipeline:</strong> Project start date is more than 2 weeks in the past, but the project is not marked as Committed or Closed Won.</li>
                  <li><strong>Holding Pots:</strong> Should not have any project dates assigned.</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Missing Data & Links</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Missing Fields:</strong> Missing Start Date, End Date, Price, Gross Budget, or Net Budget.</li>
                  <li><strong>Missing RTB Dates:</strong> Required for all standard projects (except Passthrough & Savings).</li>
                  <li><strong>Missing Fee Calculator:</strong> Committed or Closed Won projects missing a linked Fee Calculator.</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Record Type Mismatches</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Passthrough Mismatch:</strong> Project title implies passthrough costs, or margin is &le; 5%, but record type is not set to Passthrough Costs.</li>
                  <li><strong>RFI / RFP Mismatch:</strong> Title contains RFI/RFP but record type is incorrect.</li>
                  <li><strong>Talent Savings Mismatch:</strong> Title contains savings/efficiencies but record type is incorrect.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
