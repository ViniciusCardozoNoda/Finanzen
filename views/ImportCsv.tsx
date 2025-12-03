import React from 'react';
import { useLocalization } from '../context/LocalizationContext';

const ImportCsv: React.FC = () => {
  const { t } = useLocalization();

  return (
    <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-800">{t('import_csv_statement')}</h1>
        <p className="text-slate-500">{t('bulk_add_expenses')}</p>
        
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-slate-700 mb-1"><i className="fas fa-file-upload mr-2"></i>{t('step_1_upload_file')}</h2>
            <p className="text-sm text-slate-500 mb-6" dangerouslySetInnerHTML={{ __html: t('csv_instructions') }} />

            <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="csv-file">{t('statement_file_csv')}</label>
                    <input type="file" id="csv-file" accept=".csv" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="import-account">{t('import_to_account')}</label>
                    <select id="import-account" className="w-full bg-slate-50 border-slate-300 text-slate-900 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 border">
                        <option>{t('select_account')}</option>
                        <option>Conta Pessoal</option>
                    </select>
                </div>
            </div>

            <button className="w-full mt-6 bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                {t('process_file')}
            </button>
        </div>
    </div>
  );
};

export default ImportCsv;