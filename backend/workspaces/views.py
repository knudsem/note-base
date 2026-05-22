from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from core.authentication import IsAuthenticatedByHeader
from core.pagination import ContractPagination
from workspaces import services
from workspaces.permissions import IsWorkspaceMember
from workspaces.serializers import (
    AddMemberPayload,
    WorkspaceCreatePayload,
    WorkspaceSerializer,
)


class WorkspaceListCreateView(APIView):
    def get(self, request):
        queryset = services.list_workspaces_for(request.user.user_id)
        paginator = ContractPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        data = WorkspaceSerializer(page, many=True).data
        return paginator.get_paginated_response(data)

    def post(self, request):
        payload = WorkspaceCreatePayload(data=request.data)
        payload.is_valid(raise_exception=True)

        workspace = services.create_workspace(
            name=payload.validated_data["name"],
            creator_id=request.user.user_id,
        )
        return Response(
            WorkspaceSerializer(workspace).data,
            status=status.HTTP_201_CREATED,
        )


class WorkspaceAddMemberView(APIView):
    permission_classes = [IsAuthenticatedByHeader, IsWorkspaceMember]

    def post(self, request, workspace_id):
        payload = AddMemberPayload(data=request.data)
        payload.is_valid(raise_exception=True)

        workspace = services.add_member(
            workspace=self.workspace,
            caller_id=request.user.user_id,
            new_member_id=payload.validated_data["userId"],
        )
        return Response(WorkspaceSerializer(workspace).data, status=status.HTTP_200_OK)
