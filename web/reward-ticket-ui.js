// One shared reward ticket. The old campaign surfaces never compete with it.
const refreshSingleRewardTicket=refresh;
refresh=function(){refreshSingleRewardTicket();refreshComicNotifications();campaignBanner.hidden=true;campaignDismiss.hidden=true;};
