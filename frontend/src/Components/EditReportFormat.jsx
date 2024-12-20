import { useEffect, useState } from "react";
import { getLatexConfiguration, updateLatexConfiguration } from "../graphql/graphqlHelpers";
import { FaArrowLeft } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const MAX_SIZE = 5.0;
const MIN_SIZE = -5.0;

const EditReportFormatting = ({ onBack }) => {
    const [loading, setLoading] = useState(true);
    const [configurationVspace, setConfigurationVspace] = useState(0.0);
    const [configurationMargin, setConfigurationMargin] = useState(0.0);
    const [configurationFont, setConfigurationFont] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchConfiguration();
    }, []);

    const fetchConfiguration = async () => {
        setLoading(true);
        const latexConfiguration = JSON.parse(await getLatexConfiguration());
        setConfigurationVspace(latexConfiguration.vspace);
        setConfigurationFont(latexConfiguration.font);
        setConfigurationMargin(latexConfiguration.margin);
        setLoading(false);
    }

    const handleUpdateConfiguration = async () => {
        setUpdating(true);
        // Sanitation
        if (configurationVspace < MIN_SIZE || configurationVspace > MAX_SIZE || configurationMargin < 0 || configurationMargin > MAX_SIZE) {
            toast.warning('Sizes must be between -5.0 and 5.0 for vertical spacing and 0 and 5.0 for margins');
            setUpdating(false);
            return;
        }
        await updateLatexConfiguration(configurationVspace, configurationMargin, '') // empty string for fonts TODO
        setUpdating(false);
    }

    return (
        <div className=" ">
          <ToastContainer
                  position="top-right"
                  autoClose={1000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="light"
          />  
          <button onClick={onBack} className="text-zinc-800 btn btn-ghost min-h-0 h-8 mt-5 leading-tight mr-4">
            <FaArrowLeft className="h-6 w-6 text-zinc-800" />
          </button>
          <div className='mt-5 leading-tight mr-4 ml-4'>
            {loading ? (
              <div className='w-full h-full flex items-center justify-center'>
                <div className="block text-m mb-1 mt-6 text-zinc-600">Loading...</div>
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-4">
                  <button
                    type="button"
                    onClick={handleUpdateConfiguration}
                    className="btn btn-primary text-white"
                    disabled={updating}
                  >
                    {updating? 'Updating...' : 'Update Format'}
                  </button>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vertical Spacing (cm)</label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    placeholder="Enter vertical spacing"
                    min={MIN_SIZE}
                    max={MAX_SIZE}
                    step={0.1}
                    value={configurationVspace}
                    onChange={(e) => setConfigurationVspace(e.target.value)}
                  />
                </div>
    
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Margin size (cm)</label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    placeholder="Enter margin size"
                    min={MIN_SIZE}
                    max={MAX_SIZE}
                    step={0.1}
                    value={configurationMargin}
                    onChange={(e) => setConfigurationMargin(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      );
}

export default EditReportFormatting;