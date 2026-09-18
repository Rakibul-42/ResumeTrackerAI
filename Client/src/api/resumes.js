import {apiClient} from './client.js';
import policies from '../../../shared/public-site.json' with {type: 'json'};
export const resumesApi = {
  list: () => apiClient.get('/resumes').then(r => r.data),
  get: id => apiClient.get(`/resumes/${id}`).then(r => r.data),
  getVersion: (id, versionId) => apiClient.get(`/resumes/${id}/versions/${versionId}`).then(r => r.data),
  upload: (file, title, acknowledgeAi = false) => {
    const data = new FormData();
    data.append('file', file);
    if (title?.trim()) data.append('title', title.trim());
    data.append('acknowledgeAi', String(acknowledgeAi === true));
    data.append('noticeVersion', policies.aiNoticeVersion);
    // The browser supplies the multipart boundary.
    return apiClient.post('/resumes', data, {headers: {'Content-Type': false}}).then(r => r.data);
  },
  remove: id => apiClient.delete(`/resumes/${id}`).then(r => r.data),
  analyze: (id, body) => apiClient.post(`/resumes/${id}/analyze`, body).then(r => r.data),
  analyses: id => apiClient.get(`/resumes/${id}/analyses`).then(r => r.data),
  analysisForVersion: (id, versionId) => apiClient.get(`/resumes/${id}/versions/${versionId}/analysis`).then(r => r.data),
  rewrite: (id, body) => apiClient.post(`/resumes/${id}/rewrite`, body).then(r => r.data),
  diff: (id, from, to, mode = 'words') => apiClient.get(`/resumes/${id}/diff`, {params: {from, to, mode}}).then(r => r.data),
};
