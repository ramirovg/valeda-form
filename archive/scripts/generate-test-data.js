const mongoose = require('mongoose');

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/valeda-treatments';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('📊 Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Define the Treatment schema (same as in our app)
const PatientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  birthDate: { type: Date, required: true },
  age: { type: Number, required: true }
}, { _id: false });

const DoctorSchema = new mongoose.Schema({
  name: { type: String, required: true }
}, { _id: false });

const TreatmentSessionSchema = new mongoose.Schema({
  sessionNumber: { type: Number, required: true, min: 1, max: 9 },
  date: { type: Date },
  technician: { type: String },
  time: { type: String }
}, { _id: false });

const TreatmentSchema = new mongoose.Schema({
  patient: { type: PatientSchema, required: true },
  doctor: { type: DoctorSchema, required: true },
  treatmentType: { 
    type: String, 
    required: true, 
    enum: ['right-eye', 'left-eye', 'both-eyes'] 
  },
  sessions: [TreatmentSessionSchema],
  additionalIndications: { type: String, default: '' },
  creationDate: { type: Date, default: Date.now },
  lastModified: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'creationDate', updatedAt: 'lastModified' }
});

const Treatment = mongoose.model('Treatment', TreatmentSchema);

// Test data arrays
const patients = [
  { name: 'Ana García Rodríguez', age: 45 },
  { name: 'Carlos López Martínez', age: 52 },
  { name: 'María Elena Fernández', age: 38 },
  { name: 'José Antonio Ruiz', age: 61 },
  { name: 'Laura Patricia Jiménez', age: 29 },
  { name: 'Roberto Silva González', age: 47 },
  { name: 'Carmen Rosa Morales', age: 55 },
  { name: 'Diego Alejandro Torres', age: 33 },
  { name: 'Sofía Valentina Cruz', age: 41 },
  { name: 'Fernando Javier Herrera', age: 59 },
  { name: 'Isabella Marie Castillo', age: 27 },
  { name: 'Andrés Felipe Vargas', age: 44 },
  { name: 'Gabriela Esperanza Rojas', age: 36 },
  { name: 'Miguel Ángel Peña', age: 50 },
  { name: 'Valentina Lucía Santos', age: 32 },
  { name: 'Ricardo Eduardo Mendoza', age: 48 },
  { name: 'Camila Alejandra Ramos', age: 26 },
  { name: 'Juan Pablo Guerrero', age: 54 },
  { name: 'Natalia Andrea Vega', age: 39 },
  { name: 'Sebastián David Ortiz', age: 43 }
];

const doctors = [
  'Dr. García Hernández',
  'Dra. María Rodríguez',
  'Dr. Carlos Mendoza',
  'Dra. Ana Martínez',
  'Dr. Javier del Valle',
  'Dra. Patricia López',
  'Dr. Fernando Ruiz',
  'Dra. Isabel Moreno'
];

const treatmentTypes = ['right-eye', 'left-eye', 'both-eyes'];
const technicians = ['Laura González', 'Carlos Ruiz', 'Ana Morales', 'Diego Santos'];

// Helper function to generate random date within last 6 months
function getRandomDate(monthsAgo = 6) {
  const now = new Date();
  const pastDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  return new Date(pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime()));
}

// Helper function to calculate age from birth date
function calculateAge(birthDate) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Generate test data
async function generateTestData() {
  try {
    // Clear existing data
    await Treatment.deleteMany({});
    console.log('🗑️  Cleared existing treatments');

    const treatments = [];

    for (let i = 0; i < 20; i++) {
      const patient = patients[i];
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const treatmentType = treatmentTypes[Math.floor(Math.random() * treatmentTypes.length)];
      
      // Generate birth date based on age
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - patient.age);
      birthDate.setMonth(Math.floor(Math.random() * 12));
      birthDate.setDate(Math.floor(Math.random() * 28) + 1);
      
      // Generate sessions (random number of completed sessions)
      const sessions = [];
      const completedSessions = Math.floor(Math.random() * 10); // 0 to 9 sessions
      
      for (let sessionNum = 1; sessionNum <= 9; sessionNum++) {
        const session = {
          sessionNumber: sessionNum,
          technician: sessionNum <= completedSessions ? technicians[Math.floor(Math.random() * technicians.length)] : '',
          time: sessionNum <= completedSessions ? ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'][Math.floor(Math.random() * 6)] : ''
        };
        
        if (sessionNum <= completedSessions) {
          const sessionDate = getRandomDate(3); // Within last 3 months
          session.date = sessionDate;
        }
        
        sessions.push(session);
      }

      const treatment = {
        patient: {
          name: patient.name,
          birthDate: birthDate,
          age: calculateAge(birthDate)
        },
        doctor: {
          name: doctor
        },
        treatmentType: treatmentType,
        sessions: sessions,
        additionalIndications: [
          '',
          'Aplicar gotas lubricantes cada 4 horas',
          'Evitar exposición solar directa por 24 horas',
          'Usar lentes de sol durante una semana',
          'Aplicar compresas frías si hay molestias',
          'Control en 15 días'
        ][Math.floor(Math.random() * 6)],
        creationDate: getRandomDate(4),
        lastModified: getRandomDate(1)
      };

      treatments.push(treatment);
    }

    // Insert all treatments
    await Treatment.insertMany(treatments);
    console.log('✅ Successfully created 20 test treatments');

    // Show summary
    const summary = await Treatment.aggregate([
      {
        $group: {
          _id: '$doctor.name',
          count: { $sum: 1 },
          patients: { $push: '$patient.name' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Test Data Summary:');
    console.log('===================');
    summary.forEach(doc => {
      console.log(`${doc._id}: ${doc.count} treatments`);
      doc.patients.forEach(patient => console.log(`  - ${patient}`));
    });

    console.log('\n🎯 Ready to test!');
    console.log('You can now test:');
    console.log('- Patient name search (try "Ana", "Carlos", "María")');
    console.log('- Doctor name search (try "García", "Rodríguez", "Mendoza")');
    console.log('- Delete functionality with confirmation');
    console.log('- Autocomplete for both patient and doctor names');

  } catch (error) {
    console.error('❌ Error generating test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the script
generateTestData();