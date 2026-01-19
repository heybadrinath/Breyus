// Seed admin user for testing
db = db.getSiblingDB('breyus');

var existing = db.adminusers.findOne({email: 'admin@breyus.com'});

if (existing) {
  print('Admin user already exists');
  print('Email: admin@breyus.com');
} else {
  // Pre-hashed password for 'Admin123!' using bcrypt with 10 rounds
  // Generated via: bcrypt.hash('Admin123!', 10)
  var hashedPassword = '$2b$10$6AKuHqx3egms1xy1q/QGpes3kyZzmzzVNKoL62rP3za.QL/6lS3nW';

  db.adminusers.insertOne({
    email: 'admin@breyus.com',
    password: hashedPassword,
    name: 'Breyus Admin',
    role: 'super_admin',
    failedLoginAttempts: 0,
    lockUntil: null,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  print('Admin user created successfully!');
  print('Email: admin@breyus.com');
  print('Password: Admin123!');
}

// Verify
var admin = db.adminusers.findOne({email: 'admin@breyus.com'});
print('Admin found: ' + (admin ? 'Yes' : 'No'));
