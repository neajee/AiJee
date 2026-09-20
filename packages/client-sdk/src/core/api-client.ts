import { ApiTransport } from "../api/transport";
import * as auth from "../api/auth";
import * as agent from "../api/agent";
import * as chat from "../api/chat";
import * as workspaces from "../api/workspaces";
import * as git from "../api/git";
import * as fs from "../api/fs";
import * as packages from "../api/packages";
import * as tasks from "../api/tasks";
import * as models from "../api/models";
import * as modes from "../api/modes";
import * as history from "../api/history";

type Delegate<F extends (transport: ApiTransport, ...args: any[]) => any> =
  (...args: F extends (transport: ApiTransport, ...args: infer A) => any ? A : never) => ReturnType<F>;

export class ApiClient {
  private readonly transport: ApiTransport;

  constructor(serverUrl: string, accessToken: string) {
    this.transport = new ApiTransport(serverUrl, accessToken);
  }

  get serverUrl(): string { return this.transport.serverUrl; }
  get accessToken(): string { return this.transport.accessToken; }
  updateConfig(serverUrl: string, accessToken: string): void { this.transport.updateConfig(serverUrl, accessToken); }
  updateToken(accessToken: string): void { this.transport.updateToken(accessToken); }
  setAuthErrorHandler(handler: () => Promise<string | null>): void { this.transport.setAuthErrorHandler(handler); }

  readonly createDevice: Delegate<typeof auth.createDevice> = (...args) => auth.createDevice(this.transport, ...args);
  readonly listDevices: Delegate<typeof auth.listDevices> = (...args) => auth.listDevices(this.transport, ...args);
  readonly revokeDevice: Delegate<typeof auth.revokeDevice> = (...args) => auth.revokeDevice(this.transport, ...args);
  readonly createDeviceCode: Delegate<typeof auth.createDeviceCode> = (...args) => auth.createDeviceCode(this.transport, ...args);
  readonly getDeviceCode: Delegate<typeof auth.getDeviceCode> = (...args) => auth.getDeviceCode(this.transport, ...args);
  readonly logout: Delegate<typeof auth.logout> = (...args) => auth.logout(this.transport, ...args);
  readonly checkSession: Delegate<typeof auth.checkSession> = (...args) => auth.checkSession(this.transport, ...args);
  readonly runtimeStatus: Delegate<typeof agent.runtimeStatus> = (...args) => agent.runtimeStatus(this.transport, ...args);
  readonly createAgentSession: Delegate<typeof agent.createAgentSession> = (...args) => agent.createAgentSession(this.transport, ...args);
  readonly touchAgentSession: Delegate<typeof agent.touchAgentSession> = (...args) => agent.touchAgentSession(this.transport, ...args);
  readonly killSession: Delegate<typeof agent.killSession> = (...args) => agent.killSession(this.transport, ...args);
  readonly listActiveSessions: Delegate<typeof agent.listActiveSessions> = (...args) => agent.listActiveSessions(this.transport, ...args);
  readonly getAgentState: Delegate<typeof agent.getAgentState> = (...args) => agent.getAgentState(this.transport, ...args);
  readonly prompt: Delegate<typeof agent.prompt> = (...args) => agent.prompt(this.transport, ...args);
  readonly steer: Delegate<typeof agent.steer> = (...args) => agent.steer(this.transport, ...args);
  readonly followUp: Delegate<typeof agent.followUp> = (...args) => agent.followUp(this.transport, ...args);
  readonly abort: Delegate<typeof agent.abort> = (...args) => agent.abort(this.transport, ...args);
  readonly getState: Delegate<typeof agent.getState> = (...args) => agent.getState(this.transport, ...args);
  readonly getMessages: Delegate<typeof agent.getMessages> = (...args) => agent.getMessages(this.transport, ...args);
  readonly setModel: Delegate<typeof agent.setModel> = (...args) => agent.setModel(this.transport, ...args);
  readonly cycleModel: Delegate<typeof agent.cycleModel> = (...args) => agent.cycleModel(this.transport, ...args);
  readonly getAvailableModels: Delegate<typeof agent.getAvailableModels> = (...args) => agent.getAvailableModels(this.transport, ...args);
  readonly setThinkingLevel: Delegate<typeof agent.setThinkingLevel> = (...args) => agent.setThinkingLevel(this.transport, ...args);
  readonly cycleThinkingLevel: Delegate<typeof agent.cycleThinkingLevel> = (...args) => agent.cycleThinkingLevel(this.transport, ...args);
  readonly getAvailableThinkingLevels: Delegate<typeof agent.getAvailableThinkingLevels> = (...args) => agent.getAvailableThinkingLevels(this.transport, ...args);
  readonly setSteeringMode: Delegate<typeof agent.setSteeringMode> = (...args) => agent.setSteeringMode(this.transport, ...args);
  readonly setFollowUpMode: Delegate<typeof agent.setFollowUpMode> = (...args) => agent.setFollowUpMode(this.transport, ...args);
  readonly compact: Delegate<typeof agent.compact> = (...args) => agent.compact(this.transport, ...args);
  readonly setAutoCompaction: Delegate<typeof agent.setAutoCompaction> = (...args) => agent.setAutoCompaction(this.transport, ...args);
  readonly setAutoRetry: Delegate<typeof agent.setAutoRetry> = (...args) => agent.setAutoRetry(this.transport, ...args);
  readonly abortRetry: Delegate<typeof agent.abortRetry> = (...args) => agent.abortRetry(this.transport, ...args);
  readonly bash: Delegate<typeof agent.bash> = (...args) => agent.bash(this.transport, ...args);
  readonly abortBash: Delegate<typeof agent.abortBash> = (...args) => agent.abortBash(this.transport, ...args);
  readonly newSession: Delegate<typeof agent.newSession> = (...args) => agent.newSession(this.transport, ...args);
  readonly switchSession: Delegate<typeof agent.switchSession> = (...args) => agent.switchSession(this.transport, ...args);
  readonly fork: Delegate<typeof agent.fork> = (...args) => agent.fork(this.transport, ...args);
  readonly cloneSession: Delegate<typeof agent.cloneSession> = (...args) => agent.cloneSession(this.transport, ...args);
  readonly getEntries: Delegate<typeof agent.getEntries> = (...args) => agent.getEntries(this.transport, ...args);
  readonly getTree: Delegate<typeof agent.getTree> = (...args) => agent.getTree(this.transport, ...args);
  readonly getForkMessages: Delegate<typeof agent.getForkMessages> = (...args) => agent.getForkMessages(this.transport, ...args);
  readonly getLastAssistantText: Delegate<typeof agent.getLastAssistantText> = (...args) => agent.getLastAssistantText(this.transport, ...args);
  readonly getSessionStats: Delegate<typeof agent.getSessionStats> = (...args) => agent.getSessionStats(this.transport, ...args);
  readonly exportHtml: Delegate<typeof agent.exportHtml> = (...args) => agent.exportHtml(this.transport, ...args);
  readonly setSessionName: Delegate<typeof agent.setSessionName> = (...args) => agent.setSessionName(this.transport, ...args);
  readonly getCommands: Delegate<typeof agent.getCommands> = (...args) => agent.getCommands(this.transport, ...args);
  readonly getProductCapabilities: Delegate<typeof agent.getProductCapabilities> = (...args) => agent.getProductCapabilities(this.transport, ...args);
  readonly setCacheWarmingMode: Delegate<typeof agent.setCacheWarmingMode> = (...args) => agent.setCacheWarmingMode(this.transport, ...args);
  readonly setActiveTools: Delegate<typeof agent.setActiveTools> = (...args) => agent.setActiveTools(this.transport, ...args);
  readonly extensionUiResponse: Delegate<typeof agent.extensionUiResponse> = (...args) => agent.extensionUiResponse(this.transport, ...args);
  readonly createChatSession: Delegate<typeof chat.createChatSession> = (...args) => chat.createChatSession(this.transport, ...args);
  readonly listChatSessions: Delegate<typeof chat.listChatSessions> = (...args) => chat.listChatSessions(this.transport, ...args);
  readonly touchChatSession: Delegate<typeof chat.touchChatSession> = (...args) => chat.touchChatSession(this.transport, ...args);
  readonly deleteChatSession: Delegate<typeof chat.deleteChatSession> = (...args) => chat.deleteChatSession(this.transport, ...args);
  readonly listWorkspaces: Delegate<typeof workspaces.listWorkspaces> = (...args) => workspaces.listWorkspaces(this.transport, ...args);
  readonly getWorkspace: Delegate<typeof workspaces.getWorkspace> = (...args) => workspaces.getWorkspace(this.transport, ...args);
  readonly createWorkspace: Delegate<typeof workspaces.createWorkspace> = (...args) => workspaces.createWorkspace(this.transport, ...args);
  readonly updateWorkspace: Delegate<typeof workspaces.updateWorkspace> = (...args) => workspaces.updateWorkspace(this.transport, ...args);
  readonly deleteWorkspace: Delegate<typeof workspaces.deleteWorkspace> = (...args) => workspaces.deleteWorkspace(this.transport, ...args);
  readonly archiveWorkspace: Delegate<typeof workspaces.archiveWorkspace> = (...args) => workspaces.archiveWorkspace(this.transport, ...args);
  readonly unarchiveWorkspace: Delegate<typeof workspaces.unarchiveWorkspace> = (...args) => workspaces.unarchiveWorkspace(this.transport, ...args);
  readonly suggestWorkspaces: Delegate<typeof workspaces.suggestWorkspaces> = (...args) => workspaces.suggestWorkspaces(this.transport, ...args);
  readonly listWorkspaceSessions: Delegate<typeof workspaces.listWorkspaceSessions> = (...args) => workspaces.listWorkspaceSessions(this.transport, ...args);
  readonly getWorkspaceSession: Delegate<typeof workspaces.getWorkspaceSession> = (...args) => workspaces.getWorkspaceSession(this.transport, ...args);
  readonly deleteWorkspaceSession: Delegate<typeof workspaces.deleteWorkspaceSession> = (...args) => workspaces.deleteWorkspaceSession(this.transport, ...args);
  readonly renameWorkspaceSession: Delegate<typeof workspaces.renameWorkspaceSession> = (...args) => workspaces.renameWorkspaceSession(this.transport, ...args);
  readonly archiveWorkspaceSession: Delegate<typeof workspaces.archiveWorkspaceSession> = (...args) => workspaces.archiveWorkspaceSession(this.transport, ...args);
  readonly getSessionTree: Delegate<typeof workspaces.getSessionTree> = (...args) => workspaces.getSessionTree(this.transport, ...args);
  readonly getSessionLeaf: Delegate<typeof workspaces.getSessionLeaf> = (...args) => workspaces.getSessionLeaf(this.transport, ...args);
  readonly getSessionChildren: Delegate<typeof workspaces.getSessionChildren> = (...args) => workspaces.getSessionChildren(this.transport, ...args);
  readonly getSessionBranch: Delegate<typeof workspaces.getSessionBranch> = (...args) => workspaces.getSessionBranch(this.transport, ...args);
  readonly gitStatus: Delegate<typeof git.gitStatus> = (...args) => git.gitStatus(this.transport, ...args);
  readonly gitBranches: Delegate<typeof git.gitBranches> = (...args) => git.gitBranches(this.transport, ...args);
  readonly gitCheckout: Delegate<typeof git.gitCheckout> = (...args) => git.gitCheckout(this.transport, ...args);
  readonly gitCommit: Delegate<typeof git.gitCommit> = (...args) => git.gitCommit(this.transport, ...args);
  readonly gitDiff: Delegate<typeof git.gitDiff> = (...args) => git.gitDiff(this.transport, ...args);
  readonly gitDiffFile: Delegate<typeof git.gitDiffFile> = (...args) => git.gitDiffFile(this.transport, ...args);
  readonly gitDiscard: Delegate<typeof git.gitDiscard> = (...args) => git.gitDiscard(this.transport, ...args);
  readonly gitLog: Delegate<typeof git.gitLog> = (...args) => git.gitLog(this.transport, ...args);
  readonly gitStage: Delegate<typeof git.gitStage> = (...args) => git.gitStage(this.transport, ...args);
  readonly gitUnstage: Delegate<typeof git.gitUnstage> = (...args) => git.gitUnstage(this.transport, ...args);
  readonly gitNestedRepos: Delegate<typeof git.gitNestedRepos> = (...args) => git.gitNestedRepos(this.transport, ...args);
  readonly gitStashList: Delegate<typeof git.gitStashList> = (...args) => git.gitStashList(this.transport, ...args);
  readonly gitStashPush: Delegate<typeof git.gitStashPush> = (...args) => git.gitStashPush(this.transport, ...args);
  readonly gitStashApply: Delegate<typeof git.gitStashApply> = (...args) => git.gitStashApply(this.transport, ...args);
  readonly gitStashDrop: Delegate<typeof git.gitStashDrop> = (...args) => git.gitStashDrop(this.transport, ...args);
  readonly gitWorktreeList: Delegate<typeof git.gitWorktreeList> = (...args) => git.gitWorktreeList(this.transport, ...args);
  readonly gitWorktreeAdd: Delegate<typeof git.gitWorktreeAdd> = (...args) => git.gitWorktreeAdd(this.transport, ...args);
  readonly gitWorktreeRemove: Delegate<typeof git.gitWorktreeRemove> = (...args) => git.gitWorktreeRemove(this.transport, ...args);
  readonly fsList: Delegate<typeof fs.fsList> = (...args) => fs.fsList(this.transport, ...args);
  readonly fsRead: Delegate<typeof fs.fsRead> = (...args) => fs.fsRead(this.transport, ...args);
  readonly fsWrite: Delegate<typeof fs.fsWrite> = (...args) => fs.fsWrite(this.transport, ...args);
  readonly fsDelete: Delegate<typeof fs.fsDelete> = (...args) => fs.fsDelete(this.transport, ...args);
  readonly fsMkdir: Delegate<typeof fs.fsMkdir> = (...args) => fs.fsMkdir(this.transport, ...args);
  readonly fsComplete: Delegate<typeof fs.fsComplete> = (...args) => fs.fsComplete(this.transport, ...args);
  readonly fsUpload: Delegate<typeof fs.fsUpload> = (...args) => fs.fsUpload(this.transport, ...args);
  readonly fsDownload: Delegate<typeof fs.fsDownload> = (...args) => fs.fsDownload(this.transport, ...args);
  readonly packageStatus: Delegate<typeof packages.packageStatus> = (...args) => packages.packageStatus(this.transport, ...args);
  readonly packageUpdate: Delegate<typeof packages.packageUpdate> = (...args) => packages.packageUpdate(this.transport, ...args);
  readonly packageInstall: Delegate<typeof packages.packageInstall> = (...args) => packages.packageInstall(this.transport, ...args);
  readonly packageLogs: Delegate<typeof packages.packageLogs> = (...args) => packages.packageLogs(this.transport, ...args);
  readonly marketplaceSearch: Delegate<typeof packages.marketplaceSearch> = (...args) => packages.marketplaceSearch(this.transport, ...args);
  readonly marketplaceDetail: Delegate<typeof packages.marketplaceDetail> = (...args) => packages.marketplaceDetail(this.transport, ...args);
  readonly marketplaceInstalled: Delegate<typeof packages.marketplaceInstalled> = (...args) => packages.marketplaceInstalled(this.transport, ...args);
  readonly marketplaceOperation: Delegate<typeof packages.marketplaceOperation> = (...args) => packages.marketplaceOperation(this.transport, ...args);
  readonly getTaskConfig: Delegate<typeof tasks.getTaskConfig> = (...args) => tasks.getTaskConfig(this.transport, ...args);
  readonly listTasks: Delegate<typeof tasks.listTasks> = (...args) => tasks.listTasks(this.transport, ...args);
  readonly startTask: Delegate<typeof tasks.startTask> = (...args) => tasks.startTask(this.transport, ...args);
  readonly stopTask: Delegate<typeof tasks.stopTask> = (...args) => tasks.stopTask(this.transport, ...args);
  readonly restartTask: Delegate<typeof tasks.restartTask> = (...args) => tasks.restartTask(this.transport, ...args);
  readonly removeTask: Delegate<typeof tasks.removeTask> = (...args) => tasks.removeTask(this.transport, ...args);
  readonly getTaskLogs: Delegate<typeof tasks.getTaskLogs> = (...args) => tasks.getTaskLogs(this.transport, ...args);
  readonly getCustomModels: Delegate<typeof models.getCustomModels> = (...args) => models.getCustomModels(this.transport, ...args);
  readonly listBuiltinProviders: Delegate<typeof models.listBuiltinProviders> = (...args) => models.listBuiltinProviders(this.transport, ...args);
  readonly saveBuiltinProviderKey: Delegate<typeof models.saveBuiltinProviderKey> = (...args) => models.saveBuiltinProviderKey(this.transport, ...args);
  readonly removeBuiltinProviderKey: Delegate<typeof models.removeBuiltinProviderKey> = (...args) => models.removeBuiltinProviderKey(this.transport, ...args);
  readonly startProviderOAuth: Delegate<typeof models.startProviderOAuth> = (...args) => models.startProviderOAuth(this.transport, ...args);
  readonly getProviderOAuth: Delegate<typeof models.getProviderOAuth> = (...args) => models.getProviderOAuth(this.transport, ...args);
  readonly resolveProviderOAuthPrompt: Delegate<typeof models.resolveProviderOAuthPrompt> = (...args) => models.resolveProviderOAuthPrompt(this.transport, ...args);
  readonly saveCustomModels: Delegate<typeof models.saveCustomModels> = (...args) => models.saveCustomModels(this.transport, ...args);
  readonly listModes: Delegate<typeof modes.listModes> = (...args) => modes.listModes(this.transport, ...args);
  readonly createMode: Delegate<typeof modes.createMode> = (...args) => modes.createMode(this.transport, ...args);
  readonly updateMode: Delegate<typeof modes.updateMode> = (...args) => modes.updateMode(this.transport, ...args);
  readonly deleteMode: Delegate<typeof modes.deleteMode> = (...args) => modes.deleteMode(this.transport, ...args);
  readonly getSessionMode: Delegate<typeof history.getSessionMode> = (...args) => history.getSessionMode(this.transport, ...args);
  readonly getSessionHistory: Delegate<typeof history.getSessionHistory> = (...args) => history.getSessionHistory(this.transport, ...args);
  readonly setActiveSession: Delegate<typeof history.setActiveSession> = (...args) => history.setActiveSession(this.transport, ...args);
  readonly getStreamUrl: Delegate<typeof history.getStreamUrl> = (...args) => history.getStreamUrl(this.transport, ...args);
  readonly getWsStreamUrl: Delegate<typeof history.getWsStreamUrl> = (...args) => history.getWsStreamUrl(this.transport, ...args);
}
