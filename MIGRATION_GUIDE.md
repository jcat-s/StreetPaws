# Reports Migration Guide

This guide explains how to migrate from the old separate collections structure to the new unified reports structure.

## Overview

### Old Structure (Before Migration)
```
lost/{reportId}           # Lost reports in separate collection
found/{reportId}          # Found reports in separate collection  
reports/{reportId}        # Abuse reports in main reports collection
```

### New Structure (After Migration)
```
reports/{parentId}/
├── lost/{reportId}       # Lost reports in subcollection
├── found/{reportId}      # Found reports in subcollection
└── abuse/{reportId}      # Abuse reports in subcollection
```

## Benefits of New Structure

1. **Consistent Organization**: All reports follow the same pattern
2. **Easier Queries**: Use `collectionGroup` queries to get all report types
3. **Better Performance**: Reduced query complexity
4. **Future-Proof**: Easy to add new report types
5. **Simplified Admin Code**: One query pattern for all report types

## Migration Steps

### 1. Backup Your Data

**IMPORTANT**: Always backup your Firestore data before running the migration!

```bash
# Export your Firestore data
gcloud firestore export gs://your-backup-bucket/backup-$(date +%Y%m%d-%H%M%S)
```

### 2. Update Your Code

The code has already been updated to support the new structure. Make sure you have the latest version.

### 3. Set Up Firebase Admin SDK

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file as `serviceAccountKey.json` in your project root
4. Update the project ID in `scripts/migrate-reports.js`

### 4. Run the Migration

```bash
# Install dependencies (if not already installed)
npm install

# Run the migration
npm run migrate-reports

# After successful migration, clean up old collections
npm run migrate-reports:cleanup
```

### 5. Verify the Migration

1. Check that all reports appear in the admin panel
2. Verify that images are still accessible
3. Test creating new reports
4. Ensure all report types are working correctly

## Migration Script Details

The migration script (`scripts/migrate-reports.js`) does the following:

1. **Migrates Lost Reports**: Moves from `lost/{id}` to `reports/{parentId}/lost/{id}`
2. **Migrates Found Reports**: Moves from `found/{id}` to `reports/{parentId}/found/{id}`
3. **Migrates Abuse Reports**: Moves from `reports/{id}` to `reports/{parentId}/abuse/{id}`
4. **Preserves All Data**: Maintains all fields, timestamps, and relationships
5. **Batch Processing**: Uses Firestore batches for efficient processing
6. **Error Handling**: Includes comprehensive error handling and logging

## Rollback Plan

If you need to rollback:

1. **Stop the application** to prevent new data from being created
2. **Restore from backup** using Firebase Console or gcloud CLI
3. **Revert code changes** to the previous version
4. **Test thoroughly** before resuming operations

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure your service account has proper Firestore permissions
2. **Batch Size Errors**: The script handles Firestore's 500-operation batch limit automatically
3. **Memory Issues**: For large datasets, the script processes in batches to avoid memory issues

### Getting Help

If you encounter issues:

1. Check the console output for specific error messages
2. Verify your Firebase configuration
3. Ensure you have sufficient permissions
4. Check Firestore quotas and limits

## Post-Migration Tasks

After successful migration:

1. **Update Firestore Rules**: The rules have been updated to support the new structure
2. **Update Supabase Storage**: Ensure your Supabase bucket is configured correctly
3. **Test All Functionality**: Verify that all report types work correctly
4. **Monitor Performance**: Check that queries are performing well
5. **Update Documentation**: Update any internal documentation

## File Structure Changes

### Supabase Storage
- **Bucket**: `report-uploads` (unified bucket for all report types)
- **Lost Reports**: `lostandfound/lost/{timestamp}-{random}-{filename}`
- **Found Reports**: `lostandfound/found/{timestamp}-{random}-{filename}`
- **Abuse Reports**: `{userId}/{timestamp}-{random}.{ext}`

### Firestore Structure
- **Parent Documents**: `reports/{parentId}` (container with metadata)
- **Subcollections**: `reports/{parentId}/{type}/{reportId}` (actual report data)

## Performance Considerations

The new structure offers several performance benefits:

1. **Reduced Query Complexity**: Single query pattern for all report types
2. **Better Indexing**: More efficient composite indexes
3. **Improved Caching**: Better cache utilization with unified structure
4. **Scalability**: Easier to scale as report volume grows

## Security Updates

The new structure maintains the same security model:

- **Admin Access**: Full read/write access to all reports
- **User Access**: Users can only read/write their own reports
- **Anonymous Access**: Limited to creating reports (not reading others')
- **Abuse Reports**: Require authentication for reading

## Monitoring

After migration, monitor:

1. **Query Performance**: Check Firestore usage and query times
2. **Storage Usage**: Monitor Supabase storage consumption
3. **Error Rates**: Watch for any increase in errors
4. **User Experience**: Ensure users can still create and view reports

## Support

For questions or issues with the migration:

1. Check this guide first
2. Review the migration script logs
3. Verify your Firebase and Supabase configuration
4. Test with a small dataset first if possible

