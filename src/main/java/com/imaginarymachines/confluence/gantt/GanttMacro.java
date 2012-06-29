package com.imaginarymachines.confluence.gantt;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Date;
import java.util.Map;
import java.util.List;
import java.util.Iterator;
import java.text.SimpleDateFormat;
import java.util.Calendar;

import com.atlassian.renderer.RenderContext;
import com.atlassian.renderer.v2.macro.BaseMacro;
import com.atlassian.renderer.v2.macro.MacroException;
import com.atlassian.renderer.v2.RenderMode;
import com.atlassian.spring.container.ContainerManager;
import com.atlassian.confluence.core.ContentEntityObject;
import com.atlassian.confluence.pages.Attachment;
import com.atlassian.confluence.pages.AttachmentManager;
import com.atlassian.confluence.pages.PageManager;
import com.atlassian.confluence.pages.Page;
import com.atlassian.confluence.renderer.PageContext;
import com.atlassian.confluence.renderer.radeox.macros.MacroUtils;
import com.atlassian.confluence.security.Permission;
import com.atlassian.confluence.security.PermissionManager;
import com.atlassian.confluence.setup.settings.SettingsManager;
import com.atlassian.confluence.spaces.SpaceManager;
import com.atlassian.confluence.user.AuthenticatedUserThreadLocal;
import com.atlassian.confluence.util.velocity.VelocityUtils;
import com.atlassian.user.User;
import com.atlassian.plugin.webresource.WebResourceManager;
import com.atlassian.plugin.webresource.WebResourceUrlProvider;
import com.atlassian.plugin.webresource.UrlMode;

/**
 * This very simple macro shows you the very basic use-case of displaying *something* on the Confluence page where it is used.
 * Use this example macro to toy around, and then quickly move on to the next example - this macro doesn't
 * really show you all the fun stuff you can do with Confluence.
 */
public class GanttMacro extends BaseMacro
{
	
    private final PageManager pageManager;
    private final SpaceManager spaceManager;
	private WebResourceManager webResourceManager;
	private WebResourceUrlProvider webResourceUrlProvider;
    //private static final String MACRO_BODY_TEMPLATE = "templates/rendermacro.vm";
    private static final String MACRO_BODY_TEMPLATE = "templates/rendersched.vm";
    private SimpleDateFormat dateformatter = new SimpleDateFormat("yyyy-MM-dd");
    
    public GanttMacro(PageManager pageManager, SpaceManager spaceManager, WebResourceManager webResourceManager, WebResourceUrlProvider webResourceUrlProvider)
    {
        this.pageManager = pageManager;
        this.spaceManager = spaceManager;
		this.webResourceManager = webResourceManager;
		this.webResourceUrlProvider = webResourceUrlProvider;
    }

    public boolean isInline()
    {
        return false;
    }
    
    public boolean hasBody()
    {
        return false;
    }

    public RenderMode getBodyRenderMode()
    {
        return RenderMode.NO_RENDER;
    }

    /**
     * This method returns XHTML to be displayed on the page that uses this macro
     * we just do random stuff here, trying to show how you can access the most basic
     * managers and model objects. No emphasis is put on beauty of code nor on
     * doing actually useful things :-)
     */
    public String execute(Map params, String body, RenderContext renderContext)
            throws MacroException
    {

    	PageContext pageContext = ((PageContext) renderContext);
    	ContentEntityObject contententity = pageContext.getEntity();
    	Page page = (Page)contententity;
    	
    	SettingsManager settingsManager = (SettingsManager) ContainerManager.getComponent("settingsManager");
    	PermissionManager permissionManager = (PermissionManager) ContainerManager.getComponent("permissionManager");
    	AttachmentManager attachmentManager = (AttachmentManager)ContainerManager.getComponent("attachmentManager");
    	
    	User user = AuthenticatedUserThreadLocal.getUser();
    	
    	String attachmentname = (String)params.get("attachment");
    	
		webResourceManager.requireResource("com.imaginarymachines.confluence.gantt.gantt4confluence:staticscripts");
    	
    	
    	Calendar calToday = Calendar.getInstance();
    	Calendar calLowerdatebound = Calendar.getInstance();
    	Calendar calUpperdatebound = Calendar.getInstance();
    	//lowerdatebound.setTime(today.getTime()-(1000*60*60*24*365));
    	//upperdatebound.setTime(today.getTime()+(1000*60*60*24*365));
    	calLowerdatebound.add(Calendar.YEAR, -1);
    	calUpperdatebound.add(Calendar.YEAR, +1);
    	
    	Date lowerdatebound = calLowerdatebound.getTime();
    	Date upperdatebound = calUpperdatebound.getTime();
    	
    	try {
    		if (params.containsKey("lbound")) lowerdatebound = dateformatter.parse((String)params.get("lbound"));
    		if (params.containsKey("ubound")) upperdatebound = dateformatter.parse((String)params.get("ubound"));
    	} catch(Exception e) {
    		e.printStackTrace();
    	}
    	
    	Map<String, Object> context = MacroUtils.defaultVelocityContext();
    	context.put("siteRootURL", renderContext.getSiteRoot());
    	context.put("baseURL", settingsManager.getGlobalSettings().getBaseUrl());
    	context.put("pageid", page.getIdAsString());
    	context.put("user", user.getFullName());
    	context.put("filename", attachmentname);
    	context.put("editable", permissionManager.hasPermission(user, Permission.EDIT, page));
    	context.put("width", (String)params.get("width"));
    	context.put("height", (String)params.get("height"));
    	context.put("orientation", (String)params.get("orientation"));
    	context.put("lowerdatebound-year", lowerdatebound.getYear()+1900);
    	context.put("lowerdatebound-month", lowerdatebound.getMonth());
    	context.put("lowerdatebound-day", lowerdatebound.getDate());
    	context.put("upperdatebound-year", upperdatebound.getYear()+1900);
    	context.put("upperdatebound-month", upperdatebound.getMonth());
    	context.put("upperdatebound-day", upperdatebound.getDate());
        
		context.put("extjsUrl", webResourceUrlProvider.getStaticPluginResourceUrl("com.imaginarymachines.confluence.gantt.gantt4confluence:staticscripts", "extjs-4.0.7/ext-all.js", UrlMode.ABSOLUTE));
		System.out.println("extjs Path: "+webResourceUrlProvider.getStaticPluginResourceUrl("com.imaginarymachines.confluence.gantt.gantt4confluence:staticscripts", "extjs-4.0.7/ext-all.js", UrlMode.ABSOLUTE));
		System.out.println("Static Resource Prefix: "+webResourceUrlProvider.getStaticResourcePrefix(UrlMode.ABSOLUTE));
		context.put("staticResourcePrefix",webResourceUrlProvider.getStaticResourcePrefix(UrlMode.ABSOLUTE));
		
    	return VelocityUtils.getRenderedTemplate(MACRO_BODY_TEMPLATE, context);
    	
    }

}