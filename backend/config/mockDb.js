const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbFilePath = path.join(__dirname, 'mock_db_store.json');

if (!fs.existsSync(dbFilePath)) {
  fs.writeFileSync(dbFilePath, JSON.stringify({ users: [], queries: [], schemas: [] }, null, 2));
}

function getStore() {
  try {
    return JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
  } catch (e) {
    return { users: [], queries: [], schemas: [] };
  }
}

function writeStore(store) {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(store, null, 2));
  } catch (e) {
    console.error('Failed to write local database store:', e.message);
  }
}

const setupMockDB = () => {
  console.log('\n=============================================================');
  console.log('⚠️  SQLGENIE OFFLINE FALLBACK ENABLED');
  console.log('   MongoDB connection selection timed out.');
  console.log('   Active Storage: backend/config/mock_db_store.json');
  console.log('=============================================================\n');

  // Override model queries to redirect to JSON file database
  const overrideModel = (ModelClass, collectionName) => {
    
    // Override find
    ModelClass.find = async function(query = {}) {
      const store = getStore();
      let list = store[collectionName] || [];
      
      // Basic filtering
      if (query.user) {
        list = list.filter(item => item.user === query.user.toString());
      }
      
      return list.map(item => {
        const doc = new ModelClass(item);
        doc._id = item._id;
        doc.isNew = false;
        return doc;
      });
    };

    // Override findOne
    ModelClass.findOne = async function(query = {}) {
      const store = getStore();
      const list = store[collectionName] || [];
      let found = null;

      if (query.email) {
        found = list.find(item => item.email === query.email.toLowerCase());
      } else if (query.user) {
        found = list.find(item => item.user === query.user.toString());
      } else if (query._id) {
        found = list.find(item => item._id === query._id.toString());
      } else if (query.id) {
        found = list.find(item => item._id === query.id.toString());
      } else if (Object.keys(query).length > 0) {
        // match key values
        found = list.find(item => {
          return Object.entries(query).every(([k, v]) => item[k] === v);
        });
      }
      
      if (!found) return null;
      
      const doc = new ModelClass(found);
      doc._id = found._id;
      doc.isNew = false;
      return doc;
    };

    // Override findById
    ModelClass.findById = async function(id) {
      if (!id) return null;
      return ModelClass.findOne({ _id: id });
    };

    // Override findByIdAndUpdate
    ModelClass.findByIdAndUpdate = async function(id, update, options) {
      const doc = await ModelClass.findById(id);
      if (!doc) return null;
      
      if (update.$set) {
        Object.assign(doc, update.$set);
      } else {
        Object.assign(doc, update);
      }
      
      await doc.save();
      return doc;
    };

    // Override findOneAndDelete
    ModelClass.findOneAndDelete = async function(query = {}) {
      const store = getStore();
      const list = store[collectionName] || [];
      let foundIndex = -1;
      
      if (query._id) {
        foundIndex = list.findIndex(item => item._id === query._id.toString());
      } else if (Object.keys(query).length > 0) {
        foundIndex = list.findIndex(item => {
          return Object.entries(query).every(([k, v]) => item[k] === v);
        });
      }
      
      if (foundIndex === -1) return null;
      const removed = list.splice(foundIndex, 1)[0];
      
      store[collectionName] = list;
      writeStore(store);
      
      const doc = new ModelClass(removed);
      doc._id = removed._id;
      doc.isNew = false;
      return doc;
    };

    // Override deleteMany
    ModelClass.deleteMany = async function(query = {}) {
      const store = getStore();
      let list = store[collectionName] || [];
      const originalLength = list.length;
      
      if (query.user) {
        store[collectionName] = list.filter(item => item.user !== query.user.toString());
      } else {
        store[collectionName] = [];
      }
      
      writeStore(store);
      return { deletedCount: originalLength - store[collectionName].length };
    };

    // Override create
    ModelClass.create = async function(data) {
      const store = getStore();
      const list = store[collectionName] || [];
      
      const newDoc = new ModelClass(data);
      newDoc._id = newDoc._id || new mongoose.Types.ObjectId().toString();
      
      // Hash password if User model and password present
      if (collectionName === 'users' && data.password) {
        const salt = await bcrypt.genSalt(10);
        newDoc.password = await bcrypt.hash(data.password, salt);
      }

      const rawData = JSON.parse(JSON.stringify(newDoc));
      rawData._id = newDoc._id.toString();
      
      list.push(rawData);
      store[collectionName] = list;
      writeStore(store);
      
      newDoc.isNew = false;
      return newDoc;
    };

    // Override save
    ModelClass.prototype.save = async function() {
      const store = getStore();
      const list = store[collectionName] || [];
      
      const idStr = this._id ? this._id.toString() : new mongoose.Types.ObjectId().toString();
      this._id = idStr;
      
      // Hash password if User model and password modified
      if (collectionName === 'users' && this.isModified && this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
      }

      const rawData = JSON.parse(JSON.stringify(this));
      rawData._id = idStr;
      
      const existingIdx = list.findIndex(item => item._id === idStr);
      if (existingIdx !== -1) {
        list[existingIdx] = rawData;
      } else {
        list.push(rawData);
      }
      
      store[collectionName] = list;
      writeStore(store);
      
      this.isNew = false;
      return this;
    };

    // Override select methods of Schema/Query instances
    ModelClass.select = () => ModelClass;
  };

  const User = mongoose.model('User');
  const Query = mongoose.model('Query');
  const SchemaCatalog = mongoose.model('SchemaCatalog');

  overrideModel(User, 'users');
  overrideModel(Query, 'queries');
  overrideModel(SchemaCatalog, 'schemas');
};

module.exports = setupMockDB;
