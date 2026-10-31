// Proje tanımını (projects/<id>/project.json) yükler.

export function projectUrl(projectId, file) {
  return `projects/${encodeURIComponent(projectId)}/${file}`;
}

export async function loadProject(projectId) {
  if (!projectId) throw new Error('project id missing (body[data-project])');
  const response = await fetch(projectUrl(projectId, 'project.json'));
  if (!response.ok) throw new Error(`project.json: ${response.status}`);
  return response.json();
}
