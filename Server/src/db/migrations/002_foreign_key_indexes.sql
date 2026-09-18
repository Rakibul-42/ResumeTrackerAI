CREATE INDEX resumes_current_version_idx ON resumes(current_version_id);
CREATE INDEX resume_versions_parent_idx ON resume_versions(parent_version_id);
CREATE INDEX activity_resume_idx ON activity_events(resume_id);
CREATE INDEX activity_version_idx ON activity_events(version_id);
CREATE INDEX activity_analysis_idx ON activity_events(analysis_id);
