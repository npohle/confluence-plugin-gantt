package com.imaginarymachines.confluence.gantt;

import com.atlassian.confluence.core.DefaultSaveContext;
import com.atlassian.confluence.pages.Attachment;
import com.atlassian.confluence.pages.AttachmentManager;
import com.atlassian.confluence.pages.Page;
import com.atlassian.confluence.pages.PageManager;
import com.atlassian.confluence.renderer.radeox.macros.MacroUtils;
import com.atlassian.confluence.setup.settings.SettingsManager;
import com.atlassian.confluence.util.velocity.VelocityUtils;
import com.atlassian.plugin.webresource.WebResourceManager;
import com.atlassian.spring.container.ContainerManager;

import org.apache.log4j.Logger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.ObjectInputStream;
import java.io.StringBufferInputStream;
import java.util.Map;

public class GanttServlet extends HttpServlet {
	private final Logger logger = Logger.getLogger(this.getClass());
	
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		
		System.out.println("SERVLET ");
		
		String actionName = request.getParameter("action");
		
		if (actionName!=null && actionName.equals("get")) {
			
			SettingsManager settingsManager = (SettingsManager) ContainerManager.getComponent("settingsManager");
        	WebResourceManager webResourceManager = (WebResourceManager)ContainerManager.getComponent("webResourceManager");
        	AttachmentManager attachmentManager = (AttachmentManager)ContainerManager.getComponent("attachmentManager");
        	
        	PageManager pageManager = (PageManager)ContainerManager.getComponent("pageManager");
        	Integer pageid = Integer.parseInt(request.getParameter("pageid"));
        	Page page = (Page)pageManager.getPage(pageid);
        	//String body = page.getContent();
        	
           	String attachmentname = request.getParameter("filename");
           	System.out.println("Look for "+attachmentname+".");
           	if (attachmentname!=null && (attachmentname.endsWith(".tasks.xml") || attachmentname.endsWith(".deps.xml") || attachmentname.endsWith(".tasks.json") || attachmentname.endsWith(".json"))) {
            	try {
    	        	
            		Attachment attachment = attachmentManager.getAttachment(page, attachmentname);
    	        	
    	        	if (attachment!=null) {
    	        		if (attachmentname.endsWith("xml")) response.setContentType("text/xml;charset=UTF-8");
    	        		if (attachmentname.endsWith("json")) response.setContentType("application/javascript");
    	        		BufferedReader input = new BufferedReader(new InputStreamReader(attachment.getContentsAsStream()));
    		        	try {
    		        		String line = null;
    		        		while ((line = input.readLine()) != null) response.getWriter().write(line);;
    		        	 } catch( IOException e ) {
    		        		 System.err.println( e );
    		        	 } finally {
    		        		 input.close();
    		        	 }
    	        	} else {
    	        		System.out.println("Attachment "+attachmentname+" not found.");
    	        	}
    	    	} catch(Exception e) {
    	    		e.printStackTrace();
    	    	}
           	}
           	
		}
		
		if (actionName!=null && actionName.equals("save")) {
        	
        	PageManager pageManager = (PageManager)ContainerManager.getComponent("pageManager");
        	AttachmentManager attachmentManager = (AttachmentManager)ContainerManager.getComponent("attachmentManager");
        	
        	Integer pageid = Integer.parseInt(request.getParameter("pageid"));
        	String body = request.getParameter("body");
        	String filename = request.getParameter("filename");
        	try {
	        	Page page = (Page)pageManager.getPage(pageid);
	        	Attachment attachment = attachmentManager.getAttachment(page, filename);
	            Attachment previousVersion = null;
	            if(attachment == null)
	                attachment = new Attachment();
	            else
	                previousVersion = (Attachment)attachment.clone();
	            attachment.setContentType("application/javascript");
	            if(previousVersion != null)
	                attachment.setFileName(previousVersion.getFileName());
	            else
	                attachment.setFileName(filename);
	            attachment.setComment("Updated through gantt4confluence");
	            attachment.setFileSize(body.length());
	            
	            page.addAttachment(attachment);
	            InputStream input = new StringBufferInputStream(body);
	            
	            try {
	                attachmentManager.saveAttachment(attachment, previousVersion, input);
	            }
	            finally
	            {
	                input.close();
	            }
	            
	        	response.getWriter().write("OK");
        	} catch(Exception e) {
        		e.printStackTrace();
        	}
        	
        }
    }
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doPost(request, response);
	}
}