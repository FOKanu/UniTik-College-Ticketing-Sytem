// Placeholder seed script. TODO: implement once module business logic + Prisma migrations are in place.
// See database/seed/README.md for what to seed.

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('TODO: implement seed data (users, tickets, FAQ entries, one problem record).');
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
