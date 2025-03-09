import { motion } from 'framer-motion';
import { Wand2, LibraryBig, ShieldCheck, Users, FileText } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Floating Sidebar */}
      <motion.nav
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        style={{ position: 'fixed', top: 0, left: 0, height: '100%', width: '16rem', backgroundColor: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '1rem', borderRight: '1px solid #E9D8FD' }}
      >
        <div className="flex flex-col h-full">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-purple-600">ScholarForge</h2>
          </div>
          
          <nav className="space-y-4 flex-1">
            {[
              { icon: Wand2, label: 'Generator' },
              { icon: LibraryBig, label: 'Library' },
              { icon: ShieldCheck, label: 'Quality' },
              { icon: Users, label: 'Team' },
            ].map((item, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05 }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'white', color: '#4A5568' }}
              >
                <item.icon style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem', color: '#805AD5' }} />
                {item.label}
              </motion.button>
            ))}
          </nav>

          <div className="border-t pt-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Dashboard Cards */}
          {[1, 2, 3].map((item) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)', transition: 'box-shadow 0.2s' }}
              whileHover={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
            >
              <FileText style={{ width: '2rem', height: '2rem', color: '#805AD5', marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Recent Paper</h3>
              <p style={{ color: '#A0AEC0' }}>Last modified 2h ago</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}