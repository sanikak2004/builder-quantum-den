# Netlify Database Setup Guide

This guide explains how to connect your PostgreSQL database to your Netlify deployment of the Authen Ledger eKYC application.

## Prerequisites

1. A Netlify account
2. A PostgreSQL database (local or cloud-hosted)
3. The database connection URL

## Database Connection Setup

### 1. Prepare Your Database Connection String

The application requires a PostgreSQL database connection string in the following format:

```
postgresql://username:password@host:port/database_name?sslmode=require
```

Example:
```
postgresql://avnadmin:AVNS_ltoOZ6TzwV4Xg61XsSI@blockchain-maskeriya338-1f80.f.aivencloud.com:27251/defaultdb?sslmode=require
```

### 2. Add Environment Variables to Netlify

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** > **Environment variables**
3. Add the following environment variables:

| Variable Name | Value |
|---------------|-------|
| `DATABASE_URL` | Your PostgreSQL connection string |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | A strong random string for JWT token generation |
| `ENCRYPTION_KEY` | A 32-character string for data encryption |

Example values:
```
DATABASE_URL=postgresql://avnadmin:AVNS_ltoOZ6TzwV4Xg61XsSI@blockchain-maskeriya338-1f80.f.aivencloud.com:27251/defaultdb?sslmode=require
NODE_ENV=production
JWT_SECRET=your_super_secure_jwt_secret_here_replace_with_random_string
ENCRYPTION_KEY=your_32_character_encryption_key_here
```

### 3. Deploy Your Site

After setting up the environment variables:

1. Commit and push your code to your Git repository
2. Netlify will automatically deploy your site
3. Or manually trigger a new deployment from the Netlify dashboard

## Database Schema Setup

Before your application can work properly, you need to set up the database schema.

### Option 1: Manual Schema Setup

1. Connect to your PostgreSQL database using a client like psql or pgAdmin
2. Run the migration SQL from the [prisma/migrations](file:///c:/Users/ARYAN/Desktop/newbuild/builder-quantum-den/prisma/migrations) directory

### Option 2: Using Prisma CLI (Recommended)

If you have the Prisma CLI installed:

1. Set your DATABASE_URL environment variable locally:
   ```bash
   export DATABASE_URL=your_database_connection_string
   ```

2. Run the Prisma migration:
   ```bash
   npx prisma migrate deploy
   ```

## Testing the Database Connection

After deployment, you can test if the database connection is working:

1. Visit your Netlify site's API health endpoint:
   ```
   https://your-site-name.netlify.app/api/health
   ```

2. You should see a response like:
   ```json
   {
     "status": "ok",
     "service": "authen-ledger-api",
     "database": {
       "connected": true
     },
     "features": {
       "database": "postgresql",
       "blockchain": "custom",
       "storage": "ipfs-ready"
     }
   }
   ```

## Troubleshooting

### Common Issues

1. **"Connection terminated unexpectedly"**
   - Check that your database allows connections from Netlify's IP addresses
   - Verify your database credentials
   - Ensure SSL mode is correctly configured

2. **"Role does not exist"**
   - Verify the database username in your connection string
   - Check that the user has the necessary permissions

3. **"Database does not exist"**
   - Verify the database name in your connection string
   - Ensure the database has been created

### Debugging Steps

1. Check Netlify function logs:
   - Go to your Netlify site dashboard
   - Navigate to **Functions** > **api**
   - Check the logs for any error messages

2. Test your connection string locally:
   ```bash
   # Install a PostgreSQL client
   npm install -g pgcli
   
   # Test the connection
   pgcli "postgresql://username:password@host:port/database_name?sslmode=require"
   ```

3. Verify environment variables:
   - Check that all required environment variables are set in Netlify
   - Ensure there are no extra spaces or characters in the values

## Security Considerations

1. **Never commit database credentials** to your version control system
2. **Use strong, unique passwords** for your database
3. **Enable SSL connections** to your database
4. **Restrict database access** to only necessary IP addresses
5. **Regularly rotate credentials** for enhanced security

## Advanced Configuration

### Connection Pooling

For high-traffic applications, consider using connection pooling:

```
DATABASE_URL=postgresql://username:password@host:port/database_name?sslmode=require&connection_limit=5
```

### Multiple Environments

You can set up different database connections for different deploy contexts:

- **Branch deploys**: Use a development database
- **Deploy previews**: Use a staging database
- **Production**: Use your production database

In Netlify, you can set environment variables for specific contexts under **Site settings** > **Environment variables** > **Edit variables** > **Reveal draft scopes**.

## Support

If you're experiencing issues with database connectivity:

1. Check the Netlify function logs for detailed error messages
2. Verify your database is accessible from external connections
3. Ensure your database credentials are correct
4. Check that your database schema is properly set up
5. Consult the main project documentation for additional guidance