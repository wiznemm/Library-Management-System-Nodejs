const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());

const dbURL = 'mongodb://localhost:27017/lms_database'; 

mongoose.connect(dbURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  family: 4,
});

const secretKey = 'militarybratas';

function verifyToken(req, res, next) {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = { email };
  const token = jwt.sign(user, secretKey);

  res.json({ token });
});

const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  genre: String,
  year: Number,
});

const Book = mongoose.model('Book', bookSchema);


const authorSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const Author = mongoose.model('Author', authorSchema);


const userSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const User = mongoose.model('User', userSchema);


const orderSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  quantity: Number,
  orderDate: Date,
});

const Order = mongoose.model('Order', orderSchema);


app.get('/books', verifyToken, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  try {
    const books = await Book.find().skip(skip).limit(parseInt(limit));
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/books', verifyToken, async (req, res) => {
  const { title, author, genre, year } = req.body;

  try {
    const book = new Book({ title, author, genre, year });
    const savedBook = await book.save();
    res.json(savedBook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/books/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title, author, genre, year } = req.body;

  try {
    const updatedBook = await Book.findByIdAndUpdate(id, { title, author, genre, year }, { new: true });
    res.json(updatedBook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/books/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    await Book.findByIdAndDelete(id);
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/books/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const book = await Book.findById(id);
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/authors', verifyToken, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  try {
    const authors = await Author.find().skip(skip).limit(parseInt(limit));
    res.json(authors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/authors', verifyToken, async (req, res) => {
  const { name, email } = req.body;

  try {
    const author = new Author({ name, email });
    const savedAuthor = await author.save();
    res.json(savedAuthor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/authors/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  try {
    const updatedAuthor = await Author.findByIdAndUpdate(id, { name, email }, { new: true });
    res.json(updatedAuthor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/authors/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    await Author.findByIdAndDelete(id);
    res.json({ message: 'Author deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/authors/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const author = await Author.findById(id);
    res.json(author);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/users', verifyToken, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  try {
    const users = await User.find().skip(skip).limit(parseInt(limit));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/users', verifyToken, async (req, res) => {
  const { name, email } = req.body;

  try {
    const user = new User({ name, email });
    const savedUser = await user.save();
    res.json(savedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(id, { name, email }, { new: true });
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    await User.findByIdAndDelete(id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/orders', verifyToken, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  try {
    const orders = await Order.find()
      .populate('book', 'title author')
      .populate('user', 'name email')
      .skip(skip)
      .limit(parseInt(limit));
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/orders', verifyToken, async (req, res) => {
  const { bookId, userId, quantity, orderDate } = req.body;

  try {
    const book = await Book.findById(bookId);
    const user = await User.findById(userId);

    if (!book || !user) {
      return res.status(404).json({ error: 'Book or User not found' });
    }

    const order = new Order({ book: bookId, user: userId, quantity, orderDate });
    const savedOrder = await order.save();
    res.json(savedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/orders/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { bookId, userId, quantity, orderDate } = req.body;

  try {
    const book = await Book.findById(bookId);
    const user = await User.findById(userId);

    if (!book || !user) {
      return res.status(404).json({ error: 'Book or User not found' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { book: bookId, user: userId, quantity, orderDate },
      { new: true }
    );
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/orders/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    await Order.findByIdAndDelete(id);
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/orders/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 27017;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
