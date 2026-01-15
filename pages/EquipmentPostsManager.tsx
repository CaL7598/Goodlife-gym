import React, { useEffect, useState } from 'react';
import { EquipmentPost, UserRole } from '../types';
import { Plus, Trash2, Save, X, AlertTriangle, Edit2 } from 'lucide-react';
import { equipmentPostsService } from '../lib/database';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

interface EquipmentPostsManagerProps {
  role: UserRole;
  logActivity: (action: string, details: string, category: 'access' | 'admin' | 'financial') => void;
}

const EquipmentPostsManager: React.FC<EquipmentPostsManagerProps> = ({ role, logActivity }) => {
  const { showSuccess, showError } = useToast();
  const [posts, setPosts] = useState<EquipmentPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState<EquipmentPost | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<EquipmentPost | null>(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'sales' as 'sales' | 'equipment'
  });
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    category: 'sales' as 'sales' | 'equipment'
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        showError('Database not configured. Please configure Supabase.');
        return;
      }

      const data = await equipmentPostsService.getAll();
      setPosts(data);
    } catch (error: any) {
      console.error('Error loading equipment posts:', error);
      showError(`Failed to load posts: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      showError('Please fill in both title and content');
      return;
    }

    try {
      const created = await equipmentPostsService.create({
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category
      });
      setPosts(prev => [created, ...prev]);
      logActivity('Create Equipment Post', `Added ${created.category} post: ${created.title}`, 'admin');
      showSuccess('Post created successfully');
      setShowAddModal(false);
      setForm({ title: '', content: '', category: 'sales' });
    } catch (error: any) {
      console.error('Error creating post:', error);
      showError(`Failed to create post: ${error.message}`);
    }
  };

  const handleDeletePost = async (post: EquipmentPost) => {
    try {
      await equipmentPostsService.delete(post.id);
      setPosts(prev => prev.filter(p => p.id !== post.id));
      logActivity('Delete Equipment Post', `Deleted ${post.category} post: ${post.title}`, 'admin');
      showSuccess('Post deleted successfully');
    } catch (error: any) {
      console.error('Error deleting post:', error);
      showError(`Failed to delete post: ${error.message}`);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleEditClick = (post: EquipmentPost) => {
    setEditingPost(post);
    setEditForm({
      title: post.title,
      content: post.content,
      category: post.category
    });
    setShowEditModal(true);
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    if (!editForm.title.trim() || !editForm.content.trim()) {
      showError('Please fill in both title and content');
      return;
    }

    try {
      const updated = await equipmentPostsService.update(editingPost.id, {
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        category: editForm.category
      });
      setPosts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      logActivity('Update Equipment Post', `Updated ${updated.category} post: ${updated.title}`, 'admin');
      showSuccess('Post updated successfully');
      setShowEditModal(false);
      setEditingPost(null);
    } catch (error: any) {
      console.error('Error updating post:', error);
      showError(`Failed to update post: ${error.message}`);
    }
  };

  if (role !== UserRole.SUPER_ADMIN) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-slate-500 max-w-sm">Only Super Admins can manage equipment and sales posts.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Sales & Equipment Posts</h1>
          <p className="text-slate-600 mt-1">Create and manage posts shown on the Equipment & Sales page.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-2 font-semibold"
        >
          <Plus size={20} />
          New Post
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                    No posts yet. Create your first post.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{post.title}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{post.content}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        post.category === 'sales'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {post.category === 'sales' ? 'Sales' : 'Equipment'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {post.created_at ? new Date(post.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(post)}
                          className="text-rose-600 hover:text-rose-900 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(post)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-slate-200 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Create Post</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddPost} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as 'sales' | 'equipment' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  <option value="sales">Sales</option>
                  <option value="equipment">Equipment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content *</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  rows={4}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Create Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-slate-200 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Edit Post</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdatePost} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value as 'sales' | 'equipment' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                >
                  <option value="sales">Sales</option>
                  <option value="equipment">Equipment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content *</label>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  rows={4}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal
          isOpen={true}
          message={`Delete "${deleteConfirm.title}"? This cannot be undone.`}
          onConfirm={() => handleDeletePost(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

export default EquipmentPostsManager;
