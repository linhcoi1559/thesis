module.exports = {
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://admin:password123@localhost:5432/saas_db?schema=public',
  },
};
