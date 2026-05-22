from rest_framework import serializers

from workspaces.models import Workspace


class WorkspaceSerializer(serializers.ModelSerializer):
    memberIds = serializers.ListField(source="member_ids", child=serializers.CharField())
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Workspace
        fields = ["id", "name", "memberIds", "createdAt"]
        read_only_fields = ["id", "createdAt"]


class WorkspaceCreatePayload(serializers.Serializer):
    name = serializers.CharField(min_length=1, max_length=80, trim_whitespace=True)


class AddMemberPayload(serializers.Serializer):
    userId = serializers.CharField(min_length=1, max_length=64, trim_whitespace=True)
