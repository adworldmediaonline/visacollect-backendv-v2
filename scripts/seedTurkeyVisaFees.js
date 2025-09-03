import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, logger } from '../config/db.js';
import TurkeyVisaFee from '../models/TurkeyVisaFee.js';

// Load environment variables
dotenv.config();

const visaFeesData = [
  // Afghanistan
  {
    country: 'Afghanistan',
    visaFee: 66,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Algeria
  {
    country: 'Algeria',
    visaFee: 56,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Antigua and Barbuda
  {
    country: 'Antigua and Barbuda',
    visaFee: 46,
    duration: '90 Days',
    numberOfEntries: 'Multiple-Entry',
  },

  // Armenia
  {
    country: 'Armenia',
    visaFee: 36,
    duration: '30 Days',
    numberOfEntries: 'Multiple-Entry',
  },

  // Australia
  {
    country: 'Australia',
    visaFee: 66,
    duration: '90 Days',
    numberOfEntries: 'Multiple-Entry',
  },

  // Bahamas
  {
    country: 'Bahamas',
    visaFee: 26,
    duration: '90 Days',
    numberOfEntries: 'Multiple-Entry',
  },

  // Bangladesh
  {
    country: 'Bangladesh',
    visaFee: 66,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Barbados
  {
    country: 'Barbados',
    visaFee: 26,
    duration: '30 Days',
    numberOfEntries: 'Multiple-Entry',
  },

  // Bermuda
  {
    country: 'Bermuda',
    visaFee: 26,
    duration: '90 Days',
    numberOfEntries: 'Multiple-Entry',
  },

  // Bhutan
  {
    country: 'Bhutan',
    visaFee: 46,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Cambodia
  {
    country: 'Cambodia',
    visaFee: 46,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Cape Verde
  {
    country: 'Cape Verde',
    visaFee: 66,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // China
  {
    country: 'China',
    visaFee: 66,
    duration: '90 Days',
    numberOfEntries: 'Multiple-Entry',
  },

  // Dominican Republic
  {
    country: 'Dominican Republic',
    visaFee: 46,
    duration: '90 Days',
    numberOfEntries: 'Multiple-Entry',
  },

  // East Timor
  {
    country: 'East Timor',
    visaFee: 46,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Egypt
  {
    country: 'Egypt',
    visaFee: 36,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Equatorial Guinea
  {
    country: 'Equatorial Guinea',
    visaFee: 66,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Fiji
  {
    country: 'Fiji',
    visaFee: 26,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Greek Cypriot Administration of Southern Cyprus
  {
    country: 'Greek Cypriot Administration of Southern Cyprus',
    visaFee: 46,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Grenada
  {
    country: 'Grenada',
    visaFee: 66,
    duration: '90 Days',
    numberOfEntries: 'Multiple-Entry',
  },

  // Hong Kong (BN(O))
  {
    country: 'Hong Kong (BN(O))',
    visaFee: 36,
    duration: '90 Days',
    numberOfEntries: 'Multiple-Entry',
  },

  // India
  {
    country: 'India',
    visaFee: 49,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Iraq
  {
    country: 'Iraq',
    visaFee: 0,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Jamaica
  {
    country: 'Jamaica',
    visaFee: 26,
    duration: '90 Days',
    numberOfEntries: 'Multiple-Entry',
  },

  // Libya
  {
    country: 'Libya',
    visaFee: 66,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Maldives
  {
    country: 'Maldives',
    visaFee: 26,
    duration: '90 Days',
    numberOfEntries: 'Multiple-Entry',
  },

  // Mauritius
  {
    country: 'Mauritius',
    visaFee: 26,
    duration: '30 Days',
    numberOfEntries: 'Multiple-Entry',
  },

  // Mexico
  {
    country: 'Mexico',
    visaFee: 0,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Namibia
  {
    country: 'Namibia',
    visaFee: 96,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Nepal
  {
    country: 'Nepal',
    visaFee: 36,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Pakistan
  {
    country: 'Pakistan',
    visaFee: 66,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Palestine
  {
    country: 'Palestine',
    visaFee: 26,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Philippines
  {
    country: 'Philippines',
    visaFee: 26,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Saint Lucia
  {
    country: 'Saint Lucia',
    visaFee: 26,
    duration: '90 Days',
    numberOfEntries: 'Multiple-Entry',
  },

  // Saint Vincent and the Grenadines
  {
    country: 'Saint Vincent and the Grenadines',
    visaFee: 46,
    duration: '90 Days',
    numberOfEntries: 'Multiple-Entry',
  },

  // Senegal
  {
    country: 'Senegal',
    visaFee: 46,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Solomon Islands
  {
    country: 'Solomon Islands',
    visaFee: 46,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // South Africa
  {
    country: 'South Africa',
    visaFee: 0,
    duration: '30 Days',
    numberOfEntries: 'Multiple-Entry',
  },

  // Sri Lanka
  {
    country: 'Sri Lanka',
    visaFee: 41,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Suriname
  {
    country: 'Suriname',
    visaFee: 51,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Taiwan
  {
    country: 'Taiwan',
    visaFee: 0,
    duration: '30 Days',
    numberOfEntries: 'Multiple-Entry',
  },

  // Vanuatu
  {
    country: 'Vanuatu',
    visaFee: 26,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Vietnam
  {
    country: 'Vietnam',
    visaFee: 51,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },

  // Yemen
  {
    country: 'Yemen',
    visaFee: 66,
    duration: '30 Days',
    numberOfEntries: 'Single-Entry',
  },
];

const seedTurkeyVisaFees = async () => {
  try {
    // Connect to database
    await connectDB();
    logger.info('Connected to database for seeding');

    // Clear existing data
    await TurkeyVisaFee.deleteMany({});
    logger.info('Cleared existing Turkey visa fee data');

    // Prepare seed data with common service fee
    const seedData = visaFeesData.map((fee) => ({
      ...fee,
      serviceFee: 35, // Fixed service fee for all applications
      currency: 'USD',
      isActive: true,
    }));

    // Insert new data
    const insertedFees = await TurkeyVisaFee.insertMany(seedData);
    logger.info(
      `Successfully seeded ${insertedFees.length} Turkey visa fee records`
    );

    // Log summary
    const summary = {
      totalCountries: insertedFees.length,
      freeVisas: insertedFees.filter((fee) => fee.visaFee === 0).length,
      paidVisas: insertedFees.filter((fee) => fee.visaFee > 0).length,
      singleEntry: insertedFees.filter(
        (fee) => fee.numberOfEntries === 'Single-Entry'
      ).length,
      multipleEntry: insertedFees.filter(
        (fee) => fee.numberOfEntries === 'Multiple-Entry'
      ).length,
      thirtyDays: insertedFees.filter((fee) => fee.duration === '30 Days')
        .length,
      ninetyDays: insertedFees.filter((fee) => fee.duration === '90 Days')
        .length,
    };

    logger.info('Seeding summary:', summary);

    console.log('\n=== Turkey Visa Fees Seeding Complete ===');
    console.log(`Total countries: ${summary.totalCountries}`);
    console.log(`Free visas: ${summary.freeVisas}`);
    console.log(`Paid visas: ${summary.paidVisas}`);
    console.log(`Single-entry visas: ${summary.singleEntry}`);
    console.log(`Multiple-entry visas: ${summary.multipleEntry}`);
    console.log(`30-day visas: ${summary.thirtyDays}`);
    console.log(`90-day visas: ${summary.ninetyDays}`);
  } catch (error) {
    logger.error('Error seeding Turkey visa fees:', error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
};

// Run the seeding function
if (process.argv[2] === '--run') {
  seedTurkeyVisaFees()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export default seedTurkeyVisaFees;
