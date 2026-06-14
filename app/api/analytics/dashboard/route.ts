import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ hasData: false, error: 'Unauthorized', totalSent: 0, totalDelivered: 0, avgOpenRate: 0, totalConversions: 0, activeCampaigns: 0, predictedLtv: 0, currentLtv: 0, churnRate: 0, aov: 0, revenue: 0 }, { status: 401 });
    }
    const userId = session.user.id;

    const custQuery = await db.execute(sql`SELECT COUNT(*) as count FROM customers WHERE user_id = ${userId}`);
    const custRows = Array.isArray(custQuery) ? custQuery : (custQuery.rows || []);
    const customerCount = parseInt(String(custRows[0]?.count ?? 0));
    const hasData = customerCount > 0;

    if (!hasData) {
      return NextResponse.json({
        hasData: false,
        totalSent: 0, totalDelivered: 0, avgOpenRate: 0,
        totalConversions: 0, activeCampaigns: 0, predictedLtv: 0,
        currentLtv: 0, churnRate: 0, aov: 0, revenue: 0
      });
    }

    const [csStatsQuery, campsQuery, ordersQuery, recentOrdersQuery, topProductsQuery] = await Promise.all([
      db.execute(sql`
        SELECT 
          COALESCE(SUM(cs.total_sent), 0)::int         AS "totalSent",
          COALESCE(SUM(cs.total_delivered), 0)::int    AS "totalDelivered",
          COALESCE(SUM(cs.total_opened), 0)::int       AS "totalOpened",
          COALESCE(SUM(cs.total_clicked), 0)::int      AS "totalClicked",
          COALESCE(SUM(cs.total_order_placed), 0)::int AS "totalConversions",
          COALESCE(SUM(cs.revenue_attributed), 0)      AS "revenue"
        FROM campaign_stats cs
        JOIN campaigns c ON c.id = cs.campaign_id
        WHERE c.user_id = ${userId}
      `),
      db.execute(sql`
        SELECT COUNT(*)::int as active FROM campaigns WHERE status IN ('sending', 'scheduled') AND user_id = ${userId}
      `),
      db.execute(sql`
        SELECT 
          COUNT(*)::int             AS "totalOrders", 
          COALESCE(SUM(amount), 0)  AS "totalRevenue" 
        FROM orders WHERE user_id = ${userId}
      `),
      db.execute(sql`
        SELECT COUNT(DISTINCT customer_id)::int AS "activeCust" 
        FROM orders WHERE ordered_at > NOW() - INTERVAL '30 days' AND user_id = ${userId}
      `),
      db.execute(sql`
        SELECT 
          p.id, p.name, p.price, p.category,
          COUNT(DISTINCT c.id)::int                    AS "campaignCount",
          COALESCE(SUM(cs.total_sent), 0)::int         AS "totalSent",
          COALESCE(SUM(cs.total_order_placed), 0)::int AS "totalConversions"
        FROM products p
        LEFT JOIN campaigns c ON p.id = c.product_id AND c.user_id = ${userId}
        LEFT JOIN campaign_stats cs ON c.id = cs.campaign_id
        WHERE p.user_id = ${userId} OR p.user_id IS NULL
        GROUP BY p.id, p.name, p.price, p.category
        ORDER BY "totalConversions" DESC, p.price DESC
        LIMIT 5
      `)
    ]);
    
    const csRows  = Array.isArray(csStatsQuery) ? csStatsQuery : (csStatsQuery.rows || []);
    const csRow   = csRows[0] || {};

    const totalSent        = Number(csRow.totalSent)  || 0;
    const totalDelivered   = Number(csRow.totalDelivered)   || 0;
    const totalOpened      = Number(csRow.totalOpened)      || 0;
    const totalClicked     = Number(csRow.totalClicked)     || 0;
    const totalConversions = Number(csRow.totalConversions) || 0;
    const revenue          = Number(csRow.revenue) || 0;
    
    const ordersRows  = Array.isArray(ordersQuery) ? ordersQuery : (ordersQuery.rows || []);
    const ordersRow   = ordersRows[0] || {};
    const totalOrders = Number(ordersRow.totalOrders)  || 0;
    const totalRevenue= Number(ordersRow.totalRevenue) || 0;
    const aov         = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const currentLtv   = customerCount > 0 ? Math.round(totalRevenue / customerCount) : 0;
    const predictedLtv = Math.round(currentLtv * 1.2);

    const recentRows  = Array.isArray(recentOrdersQuery) ? recentOrdersQuery : (recentOrdersQuery.rows || []);
    const activeCust  = Number(recentRows[0]?.activeCust) || 0;
    const churnRate   = customerCount > 0 ? (((customerCount - activeCust) / customerCount) * 100).toFixed(1) : '0';

    const topProducts = Array.isArray(topProductsQuery) ? topProductsQuery : (topProductsQuery.rows || []);

    const campsRows      = Array.isArray(campsQuery) ? campsQuery : (campsQuery.rows || []);
    const activeCampaigns= Number(campsRows[0]?.active) || 0;

    return NextResponse.json({
      hasData: true,
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      avgOpenRate:       totalDelivered > 0 ? ((totalOpened      / totalDelivered) * 100).toFixed(1) : '0',
      clickThroughRate:  totalOpened    > 0 ? ((totalClicked     / totalOpened)    * 100).toFixed(1) : '0',
      conversionRate:    totalDelivered > 0 ? ((totalConversions / totalDelivered) * 100).toFixed(1) : '0',
      totalConversions,
      revenue,
      activeCampaigns,
      predictedLtv,
      currentLtv,
      churnRate,
      aov,
      topProducts,
    });
  } catch (err) {
    console.error('[analytics/dashboard] error:', err);
    return NextResponse.json({ hasData: false, error: String(err), totalSent: 0, totalDelivered: 0, avgOpenRate: 0, totalConversions: 0, activeCampaigns: 0, predictedLtv: 0, currentLtv: 0, churnRate: 0, aov: 0, revenue: 0 });
  }
}