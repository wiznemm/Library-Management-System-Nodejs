const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());


const JWT_SECRET = 'militarybratas';

mongoose.connect('mongodb://localhost:27017/lms_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// MongoDB models
const UserSchema = new mongoose.Schema({
  mobileNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
});

const BookSchema = new mongoose.Schema({
  genre: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
});

const OrderSchema = new mongoose.Schema({
  orderNo: { type: String, required: true, unique: true },
  studentId: { type: String, required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, required: true },
  date: { type: Date, required: true },
});

const User = mongoose.model('User', UserSchema);
const Book = mongoose.model('Book', BookSchema);
const Order = mongoose.model('Order', OrderSchema);

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden - Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Endpoint for user registration
app.post('/api/register', async (req, res) => {
  const { mobileNumber, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ $or: [{ mobileNumber }, { email }] });
  if (existingUser) {
    return res.status(409).json({ error: 'User already exists' });
  }

  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create a new user
  const user = new User({ mobileNumber, email, password: hashedPassword });
  try {
    await user.save();
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Endpoint for user login
app.post('/api/login', async (req, res) => {
  const { mobileNumber, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ mobileNumber });
  if (!user) {
    return res.status(401).json({ error: 'Invalid mobile number or password' });
  }

  // Check password
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid mobile number or password' });
  }

  // Generate JWT token
  const token = jwt.sign({ _id: user._id, role: user.role }, JWT_SECRET);
  res.json({ token });
});

// Endpoint to add a book (Admin only)
app.post('/api/books', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden - Admin access only' });
  }

  const { genre, title, author } = req.body;
  const book = new Book({ genre, title, author });
  try {
    await book.save();
    res.json({ message: 'Book added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add book' });
  }
});

// Endpoint to update a book (Admin only)
app.patch('/api/books/:bookId', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden - Admin access only' });
  }

  const { bookId } = req.params;
  const { genre, title, author } = req.body;
  try {
    const book = await Book.findByIdAndUpdate(bookId, { genre, title, author });
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ message: 'Book updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// Endpoint to search for books (Admin and User)
app.get('/api/books', async (req, res) => {
  const { genre, title, author } = req.query;
  const query = {};

  if (genre) {
    query.genre = genre;
  }
  if (title) {
    query.title = title;
  }
  if (author) {
    query.author = author;
  }

  try {
    const books = await Book.find(query);
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// Endpoint to view all orders (Admin only)
app.get('/api/orders', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden - Admin access only' });
  }

  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Endpoint to place an order (User only)
app.post('/api/orders', verifyToken, async (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ error: 'Forbidden - User access only' });
  }

  const { orderNo, studentId, bookId, date } = req.body;
  const order = new Order({ orderNo, studentId, bookId, date });
  try {
    await order.save();
    res.json({ message: 'Order placed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// Endpoint to calculate fine (User only)
app.get('/api/fine', verifyToken, async (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ error: 'Forbidden - User access only' });
  }

  const { issueDate, expiryDate } = req.query;
  if (!issueDate || !expiryDate) {
    return res.status(400).json({ error: 'issueDate and expiryDate are required query parameters' });
  }

  const issueDateTime = new Date(issueDate).getTime();
  const expiryDateTime = new Date(expiryDate).getTime();
  const currentTime = new Date().getTime();

  if (currentTime < issueDateTime) {
    return res.status(400).json({ error: 'issueDate must be in the past' });
  }

  const daysDiff = Math.floor((currentTime - expiryDateTime) / (1000 * 60 * 60 * 24));
  const finePerDay = 5; // Assuming the fine is $5 per day
  const fine = daysDiff > 0 ? daysDiff * finePerDay : 0;

  res.json({ fine });
});

// Start the server
const port = 27017;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
