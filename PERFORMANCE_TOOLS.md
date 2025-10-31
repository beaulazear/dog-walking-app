# Performance Tools Guide

## Frontend Bundle Analysis

### Using source-map-explorer

View a visual breakdown of your JavaScript bundle:

```bash
cd client
npm run build
npm run analyze
```

This will open an interactive treemap in your browser showing:
- Which packages take up the most space
- Code split chunks from lazy loading
- Individual component sizes

### What to look for:
- Large dependencies that could be replaced with lighter alternatives
- Duplicated code across chunks
- Opportunities for further code splitting

---

## Backend N+1 Query Detection

### Using Bullet

Bullet is now configured in development mode and will automatically detect N+1 queries.

When you run your Rails server:
```bash
rails s
```

Bullet will alert you in multiple ways:
1. **Browser Alert**: JavaScript alert popup (can be disabled)
2. **Console**: Output in terminal where Rails is running
3. **Rails Logger**: Written to `log/development.log`
4. **Footer**: Added to the bottom of rendered HTML pages

### Example Output:
```
USE eager loading detected
  User => [:pets]
  Add to your query: .includes(:pets)
```

### How to fix N+1 queries:
```ruby
# Before (N+1 query)
@users = User.all
@users.each { |user| user.pets.count }

# After (eager loading)
@users = User.includes(:pets).all
@users.each { |user| user.pets.count }
```

### Disabling specific alerts:
Edit `config/environments/development.rb` to customize:
```ruby
Bullet.alert = false        # Disable browser alerts
Bullet.console = true       # Keep console output
Bullet.rails_logger = true  # Keep log file output
Bullet.add_footer = false   # Disable footer injection
```

---

## Performance Optimizations Applied

### Frontend (Client):
✅ **Route-based code splitting** - Each major page loads independently
✅ **React.memo** - Expensive components won't re-render unnecessarily
✅ **Lazy loading images** - Images load only when needed
✅ **Bundle size reduced by 36%** (111 kB → 71 kB)
✅ **Removed dead code** (156 KB of unused files)

### Backend (Server):
✅ **Serializers** - Eliminated N+1 queries in API responses
✅ **Database indices** - Faster queries on appointments, invoices, cancellations
✅ **Pagination** - Reduced memory usage for large datasets
✅ **Bullet gem** - Ongoing monitoring for query performance

---

## Quick Commands Reference

```bash
# Frontend
cd client
npm start           # Development server
npm run build       # Production build
npm run analyze     # Bundle analysis
npm test            # Run tests

# Backend
rails s            # Development server (Bullet active)
rails c            # Console
rails db:migrate   # Run migrations
bundle exec rspec  # Run tests
```

---

## Next Steps for Further Optimization

1. **Review Bullet alerts** during development and fix any N+1 queries
2. **Run bundle analyzer** monthly to monitor bundle size growth
3. **Consider React Query** for advanced data caching
4. **Add performance budgets** to CI/CD pipeline
5. **Monitor Core Web Vitals** in production

---

Generated: 2025-10-31
