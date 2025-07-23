# ProSoft Hub - Professional Sports Betting Tools

A comprehensive platform providing AI-powered tools for sports betting professionals, featuring arbitrage calculators, VIP tips, and advanced prompt generation.

## 🚀 Features

- **AI Prompt Generator** - Generate professional prompts from text or images
- **Arbitrage Calculator** - Find profitable arbitrage opportunities across bookmakers
- **VIP Tips** - Access exclusive betting insights and professional analysis
- **Whop Integration** - Seamless subscription management and payment processing
- **User Management** - Trial periods, subscription tracking, and admin controls
- **Real-time Sync** - Webhook-based synchronization with Whop platform

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth + Whop OAuth
- **Payments**: Whop Integration
- **Deployment**: Vercel/Netlify ready

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Whop account for payments

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dailyatti/prosoccerbet.git
   cd prosoccerbet
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the project root:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_WHOP_PRODUCT_ID=your_whop_product_id
   ```

4. **Supabase Setup**
   - Create a new Supabase project
   - Run the migrations in `supabase/migrations/` folder
   - Set up the edge function for Whop webhooks
   - Configure environment variables in Supabase dashboard

5. **Whop Integration**
   - Create a product in Whop dashboard
   - Set up webhook endpoint: `https://your-project.supabase.co/functions/v1/whop-webhook`
   - Configure webhook secret in Supabase environment variables
   - Update product links in the application

## 🗄️ Database Setup

Run the following migrations in order:

1. `20250723185626_soft_island.sql` - Fix prompt_generations table
2. `20250723213751_bold_dream.sql` - Create users table
3. `20250723220000_whop_integration.sql` - Whop integration tables and functions

## 🔐 Environment Variables

### Frontend (.env.local)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_WHOP_PRODUCT_ID=your_whop_product_id
```

### Supabase (Dashboard)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
WHOP_WEBHOOK_SECRET=your_whop_webhook_secret
```

## 🚀 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## 🔗 Whop Integration

### Webhook Setup
1. In Whop dashboard, set webhook URL to:
   ```
   https://your-project.supabase.co/functions/v1/whop-webhook
   ```

2. Configure webhook events:
   - `payment.completed`
   - `subscription.created`
   - `subscription.updated`
   - `subscription.cancelled`
   - `subscription.expired`

### Subscription Flow
1. User signs up for trial (3 days)
2. User can upgrade to premium via Whop
3. Webhooks automatically sync subscription status
4. Access control based on subscription status

## 📱 User Experience

### Trial Users
- 3-day free trial with full access
- Upgrade prompts throughout the trial
- Seamless transition to paid subscription

### Premium Users
- Full access to all tools
- Priority support
- Advanced features and insights

### Admin Features
- User management dashboard
- Subscription monitoring
- Webhook logs and sync status
- Analytics and reporting

## 🛡️ Security

- Row Level Security (RLS) enabled on all tables
- Webhook signature verification
- Environment variable protection
- Admin-only access to sensitive operations

## 📊 Monitoring

### Webhook Monitoring
- All webhook events are logged in `whop_webhooks` table
- Sync operations tracked in `whop_sync_logs` table
- Error handling and retry mechanisms

### User Analytics
- Subscription status tracking
- Trial conversion rates
- Tool usage analytics

## 🚀 Deployment

### Vercel
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Netlify
1. Connect GitHub repository
2. Set environment variables
3. Configure build settings

### Manual Deployment
```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## 🔧 Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL in Whop dashboard
   - Verify webhook secret in Supabase
   - Check Supabase function logs

2. **Subscription sync issues**
   - Verify `sync_user_subscription` function exists
   - Check webhook processing logs
   - Ensure proper user mapping

3. **Authentication errors**
   - Verify Supabase configuration
   - Check environment variables
   - Ensure RLS policies are correct

### Debug Mode
Enable debug logging by setting:
```env
VITE_DEBUG=true
```

## 📈 Performance

- Lazy loading for components
- Optimized images and assets
- Efficient database queries with proper indexing
- CDN-ready static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Email: support@prosofthub.com
- Documentation: [docs.prosofthub.com](https://docs.prosofthub.com)
- Issues: [GitHub Issues](https://github.com/dailyatti/prosoccerbet/issues)

## 🔄 Changelog

### v1.0.0 (2025-01-27)
- Initial release
- Whop integration
- AI tools implementation
- User management system
- Trial and subscription flows