@@ .. @@
   user_display_name text,
   activity_type text,
   resource_type text,
   resource_title text,
   activity_data jsonb,
-  timestamp timestamptz,
+  activity_timestamp timestamptz,
   time_ago text
 ) AS $$
 BEGIN
@@ .. @@
     al.resource_type,
     COALESCE(d.title, al.resource_type) as resource_title,
     al.details as activity_data,
-    al.created_at as timestamp,
+    al.created_at as activity_timestamp,
     CASE 
       WHEN al.created_at > NOW() - INTERVAL '1 minute' THEN 'just now'
       WHEN al.created_at > NOW() - INTERVAL '1 hour' THEN