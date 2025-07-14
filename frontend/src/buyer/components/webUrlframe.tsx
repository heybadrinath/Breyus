import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  url: string;
}

const  Modal: React.FC<ModalProps> = ({ show, onClose, url }) => {
  if (!show) return null;

  return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-xl p-6 w-3/4 h-3/4 relative animate-fade-in flex flex-col">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={22} />
              </button>
              <h2 className="text-xl font-bold mb-4 text-center">Test Report</h2>
              
                 <iframe className='w-full h-full' src={url} title="Test Reports"></iframe> 
                
              
            </div>
            </div>


  );
  }


export default Modal;
