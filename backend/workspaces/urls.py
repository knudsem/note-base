from django.urls import path

from workspaces.views import WorkspaceAddMemberView, WorkspaceListCreateView


urlpatterns = [
    path("workspaces", WorkspaceListCreateView.as_view(), name="workspace-list-create"),
    path(
        "workspaces/<uuid:workspace_id>/members",
        WorkspaceAddMemberView.as_view(),
        name="workspace-add-member",
    ),
]
