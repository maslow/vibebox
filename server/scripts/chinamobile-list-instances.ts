/**
 * List China Mobile Cloud instances
 *
 * Usage:
 *   npx tsx server/scripts/chinamobile-list-instances.ts
 *
 * Reads credentials from environment variables (server/.env.local)
 * #chinamobile #utility #instances
 */

import { ChinaMobileClient } from '../lib/providers/chinamobile/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from server/.env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function listInstances() {
  // Get credentials from environment
  const accessKeyId = process.env.CHINAMOBILE_ACCESS_KEY_ID;
  const accessKeySecret = process.env.CHINAMOBILE_ACCESS_KEY_SECRET;
  const poolId = process.env.CHINAMOBILE_POOL_ID || 'CIDC-RP-35';

  if (!accessKeyId || !accessKeySecret) {
    console.error('❌ Missing China Mobile credentials!');
    console.error('   Set these in server/.env.local:');
    console.error('   - CHINAMOBILE_ACCESS_KEY_ID');
    console.error('   - CHINAMOBILE_ACCESS_KEY_SECRET');
    console.error('   - CHINAMOBILE_POOL_ID (optional, defaults to CIDC-RP-35)');
    process.exit(1);
  }

  const client = new ChinaMobileClient({
    accessKeyId,
    accessKeySecret,
    poolId,
  });

  try {
    console.log(`📋 Listing instances in Pool: ${poolId}\n`);

    const response = await client.listInstances({
      pageNum: 1,
      pageSize: 100,
    });

    console.log(`Total instances: ${response.totalCount}\n`);

    if (response.totalCount === 0) {
      console.log('No instances found.');
      return;
    }

    console.log('='.repeat(100));

    response.content.forEach((instance: any, index: number) => {
      const statusMap: Record<number, string> = {
        1: 'Running',
        16: 'Stopped',
        12: 'Deleted/Recycling',
      };
      const statusText = statusMap[instance.status] || `Status ${instance.status}`;
      const statusIcon = instance.status === 1 ? '🟢' : instance.status === 16 ? '🔴' : '⚪';

      console.log(`\n${index + 1}. ${instance.name || 'Unnamed'}`);
      console.log(`   ID:      ${instance.id}`);
      console.log(`   Status:  ${statusIcon} ${statusText} (${instance.status})`);
      console.log(`   Flavor:  ${instance.specsName || 'N/A'}`);
      console.log(`   Created: ${instance.createdTime || 'N/A'}`);
      console.log(`   Zone:    ${instance.zoneId || 'N/A'}`);
    });

    console.log('\n' + '='.repeat(100));

    // Status summary
    const statusCount: Record<number, number> = {};
    response.content.forEach((instance: any) => {
      statusCount[instance.status] = (statusCount[instance.status] || 0) + 1;
    });

    console.log('\n📊 Status Summary:');
    Object.entries(statusCount).forEach(([status, count]) => {
      const statusNum = parseInt(status);
      const statusMap: Record<number, string> = {
        1: '🟢 Running',
        16: '🔴 Stopped',
        12: '⚪ Deleted',
      };
      const statusText = statusMap[statusNum] || `Status ${status}`;
      console.log(`   ${statusText}: ${count}`);
    });

    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code) console.error('   Code:', error.code);
    if (error.requestId) console.error('   Request ID:', error.requestId);
    process.exit(1);
  }
}

listInstances();
