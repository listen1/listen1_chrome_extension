var ngGithub = angular.module('githubClient', []);

ngGithub.factory('github', ['$rootScope', 
function($rootScope) {
    return {
        openAuthUrl: function(){
            console.log('openAuthUrl');
            window.open(Github.getOAuthUrl(), '_blank');
        },
        getStatusText: function(){
            console.log('getStatusText');
            return Github.getStatusText();
        },
        getStatus: function(){
            return Github.getStatus();
        },
        updateStatus: function(){
            console.log('github update status');
            Github.updateStatus(function(newStatus){
                $rootScope.$broadcast('github:status', newStatus);
            });
        },
        logout: function(){
            Github.logout();
        }
    };
}]);
