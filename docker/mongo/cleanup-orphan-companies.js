// Cleanup orphan companies (companies with no associated user)
// These can occur when signup fails after company creation but before user creation

db = db.getSiblingDB('breyus');

print('Finding orphan companies...');

// Get all company IDs that have an associated user
var usedCompanyIds = db.users.distinct('company');
print('Companies with users: ' + usedCompanyIds.length);

// Find companies that are NOT in the usedCompanyIds list
var orphanCompanies = db.companies.find({
  _id: { $nin: usedCompanyIds }
}).toArray();

print('Orphan companies found: ' + orphanCompanies.length);

if (orphanCompanies.length > 0) {
  print('\nOrphan company details:');
  orphanCompanies.forEach(function(company) {
    print('  - ID: ' + company._id + ', Created: ' + (company.createdAt || 'unknown'));
  });

  // Delete orphan companies
  var result = db.companies.deleteMany({
    _id: { $nin: usedCompanyIds }
  });

  print('\nDeleted ' + result.deletedCount + ' orphan company record(s)');
} else {
  print('\nNo orphan companies found. Database is clean!');
}
