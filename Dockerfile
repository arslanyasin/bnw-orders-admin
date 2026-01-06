FROM node:21.4.0-alpine AS runner

# Set working directory
WORKDIR /app

# Create system user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application and dependencies from Jenkins build stage with correct ownership
COPY --chown=nextjs:nodejs .next ./.next
COPY --chown=nextjs:nodejs package.json ./
COPY --chown=nextjs:nodejs node_modules/ node_modules/
COPY --chown=nextjs:nodejs next.config.mjs ./

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
