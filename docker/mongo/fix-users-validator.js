// Fix users collection validator to match actual schema
// Issue: Validator requires 'email' and 'role', but schema uses 'mail' and role is optional
db = db.getSiblingDB('breyus');

print('Fixing users collection validator...');

// Update the collection validator to match the actual Mongoose schema
db.runCommand({
  collMod: 'users',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['mail', 'password'],
      properties: {
        mail: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        password: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        role: {
          enum: ['buyer', 'seller', 'admin', null],
          description: 'must be one of buyer, seller, admin, or null (optional during signup)'
        }
      }
    }
  },
  validationLevel: 'moderate'
});

print('Users collection validator updated successfully!');
print('Changes:');
print('  - Required fields changed from [email, password, role] to [mail, password]');
print('  - Field "email" renamed to "mail" to match schema');
print('  - Field "role" is now optional (set during onboarding step 5)');
