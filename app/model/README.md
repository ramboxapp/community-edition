## Adding a service

The available services are stored in the [ServiceList.js](app/store/ServicesList.js).
Structure of a service entry:

|Name|Description|Required|
|---|---|---|
|id|Unique identifier for the service, e.g. "slack"|yes|
|logo|File name of the service logo located in "/resources/icons/", e.g. "slack.png"|yes|
|name|Visible name for the service, e.g. "Slack"|yes|
|description|A short description of the service, e.g. "Slack brings all your communication together..."|yes|
|url|URL of the service, e.g. "https://\_\_\_.slack.com/". "\_\_\_" may be used as a placeholder, that can be configured when adding a service.|yes|
|type|Defines the type of the service. Must be one of `email` or `messaging`.|yes|
|allow_popups|Set to `true` to allow popup windows for the service.|no|
|note|Additional info to display when adding the service.|no|
|manual_notifications|Set to `true` to let Rambox trigger notifications. Can be used for services that doesn't support browser notifications.|no|
|js_unread|JavaScript code for setting the unread count (see below).|no|

### Setting the unread count

While by default the unread count is determined by looking for ` (COUNT)` to the window title, this describes the preferred way of doing it:

Code provided by `js_unread` will be injected into the service website.
You can retrieve the unread count in this JavaScript code e.g. by parsing elements.
Set the unread count by calling `rambox.setUnreadCount(COUNT)` or clear it by calling `rambox.clearUnreadCount()`. 
