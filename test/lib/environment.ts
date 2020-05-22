export function setDbSettings(): void {
	process.env.DB_HOST = 'localhost'
	process.env.DB_PORT = '5432'
	process.env.DB_USERNAME = 'testuser'
	process.env.DB_PASSWORD = 'testpassword'
	process.env.DB_DATABASE = 'testdb'
}
