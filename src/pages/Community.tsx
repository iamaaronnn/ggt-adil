import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { projects } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Project {
  _id: string;
  title: string;
  description: string;
  projectUrl: string;
  imageUrl?: string;
  tags: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

interface ProjectFormData {
  title: string;
  description: string;
  projectUrl: string;
  imageUrl: string;
  tags: string;
}

export default function Community() {
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [publicProjects, setPublicProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    projectUrl: '',
    imageUrl: '',
    tags: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // Get public projects
      const publicResponse = await axios.get(`${API_URL}/api/community/public`);
      setPublicProjects(publicResponse.data);

      // Get user's projects if authenticated
      if (isAuthenticated && token) {
        const userResponse = await axios.get(`${API_URL}/api/community/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserProjects(userResponse.data);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch projects",
        variant: "destructive",
      });
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast.error('Please log in to submit a project');
        return;
      }

      const data = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()),
        userId
      };

      await axios.post('/api/community/submit', data);
      toast.success('Project submitted successfully! Waiting for admin approval.');

      setShowForm(false);
      resetForm();
      fetchProjects();
    } catch (error) {
      toast.error('Failed to submit project');
      console.error('Error submitting project:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      projectUrl: '',
      imageUrl: '',
      tags: ''
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleSubmitClick = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to submit a project",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    navigate('/community/submit');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const filteredProjects = publicProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || project.tags.includes(activeTab);
    return matchesSearch && matchesTab;
  });

  return (
    <>
      <Navbar />
      <main className="bg-gray-50 min-h-screen pb-16">
        <div className="bg-gradient-to-r from-primary to-secondary text-white py-12 mb-8">
          <div className="max-w-7xl mx-auto px-6">
            <h1 className="text-4xl font-bold mb-4">Community Showcase</h1>
            <p className="text-lg max-w-3xl">
              Explore projects created by our club members. Get inspired and
              see what's possible with creativity and electronics skills.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          {/* Search and Submit */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
            <div className="w-full md:w-1/2">
              <Input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Button 
                onClick={handleSubmitClick}
                className="w-full md:w-auto"
              >
                Submit Your Project
              </Button>
            </div>
          </div>

          {/* Projects Grid */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-10">
            <div className="flex justify-center mb-8">
              <TabsList>
                <TabsTrigger value="all">All Projects</TabsTrigger>
                <TabsTrigger value="hardware">Hardware</TabsTrigger>
                <TabsTrigger value="software">Software</TabsTrigger>
                <TabsTrigger value="iot">IoT</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab}>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <div
                      key={project._id}
                      className="bg-white rounded-lg overflow-hidden shadow-md transition-transform hover:scale-105"
                    >
                      {project.imageUrl && (
                        <img
                          src={project.imageUrl}
                          alt={project.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                        <p className="text-gray-600 mb-4">{project.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {project.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-10">
                    <p className="text-gray-500">No projects found</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Featured Members */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-10">
            <h2 className="text-2xl font-bold mb-8 text-center">Featured Club Members</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                  <img 
                    src="https://i.pravatar.cc/150?img=1" 
                    alt="John Smith"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-medium">John Smith</h3>
                <p className="text-sm text-gray-600">Club President</p>
              </div>
              <div>
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                  <img 
                    src="https://i.pravatar.cc/150?img=5" 
                    alt="Emma Johnson"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-medium">Emma Johnson</h3>
                <p className="text-sm text-gray-600">Project Lead</p>
              </div>
              <div>
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                  <img 
                    src="https://i.pravatar.cc/150?img=12" 
                    alt="Michael Brown"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-medium">Michael Brown</h3>
                <p className="text-sm text-gray-600">Hardware Specialist</p>
              </div>
              <div>
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                  <img 
                    src="https://i.pravatar.cc/150?img=9" 
                    alt="Sarah Wilson"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-medium">Sarah Wilson</h3>
                <p className="text-sm text-gray-600">IoT Developer</p>
              </div>
            </div>
          </div>

          {/* Community Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl font-bold text-primary mb-2">45+</div>
              <div className="text-gray-600">Active Members</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl font-bold text-primary mb-2">120+</div>
              <div className="text-gray-600">Projects Completed</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl font-bold text-primary mb-2">36</div>
              <div className="text-gray-600">Workshops Held</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl font-bold text-primary mb-2">12</div>
              <div className="text-gray-600">Awards Won</div>
            </div>
          </div>

          {/* Join CTA */}
          <div className="bg-gradient-to-r from-secondary to-primary text-white p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Join Our Community</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Become a member of our electronics club to access exclusive resources, 
              participate in workshops, and collaborate with fellow enthusiasts.
            </p>
            <Button 
              className="bg-white text-primary hover:bg-gray-100"
              onClick={() => {
                window.location.href = "/membership";
              }}
            >
              Become a Member
            </Button>
          </div>
        </div>
      </main>

      {/* Project Details Dialog */}
      <Dialog open={!!formData.projectUrl} onOpenChange={() => setFormData({ ...formData, projectUrl: '' })}>
        {formData.projectUrl && (
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">{formData.title}</DialogTitle>
              <DialogDescription>
                {new Date(formData.createdAt).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {formData.imageUrl && (
                <img
                  src={formData.imageUrl}
                  alt={formData.title}
                  className="w-full max-h-96 object-cover rounded-md"
                />
              )}
              <p className="text-gray-700">{formData.description}</p>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Project Demo Video:</h4>
                <div className="bg-gray-100 p-4 rounded-md text-center">
                  <p>Video link: <a href={formData.projectUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{formData.projectUrl}</a></p>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setFormData({ ...formData, projectUrl: '' })}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
      <Footer />
    </>
  );
}
