// Fix admin password - generated correct bcrypt hash for 'Admin123!'
db = db.getSiblingDB('breyus');

var correctHash = '$2b$10$6AKuHqx3egms1xy1q/QGpes3kyZzmzzVNKoL62rP3za.QL/6lS3nW';

var result = db.adminusers.updateOne(
  { email: 'admin@breyus.com' },
  {
    $set: {
      password: correctHash,
      failedLoginAttempts: 0
    }
  }
);

print('Updated: ' + result.modifiedCount + ' document(s)');

// Verify
var admin = db.adminusers.findOne({ email: 'admin@breyus.com' });
print('Password hash updated: ' + (admin.password === correctHash ? 'Yes' : 'No'));
