import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';

async function runMigration() {
    const db = new sqlite3.Database('breyus.sqlite');
    
    try {
        const migrationPath = path.join(__dirname, 'create-seller-graph-tables.sql');
        const migration = fs.readFileSync(migrationPath, 'utf8');
        
        // Split migration into individual statements
        const statements = migration
            .split(';')
            .filter(statement => statement.trim())
            .map(statement => statement + ';');
        
        // Execute each statement
        for (const statement of statements) {
            await new Promise((resolve, reject) => {
                db.run(statement, (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });
        }
        
        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        db.close();
    }
}

runMigration(); 