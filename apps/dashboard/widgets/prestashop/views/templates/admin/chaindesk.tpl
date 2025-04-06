{*
 * chaindesk.tpl
 *
 * This template file is used for displaying ChatsappAI-related content in PrestaShop's admin area.
 *
 * @author chaindesk
 * @copyright chaindesk
 * @license MIT License 
 *}

{if $agentId}
<div class="bootstrap container"> 
    <div class="alert alert-success text-center mt-2">
        <h2>{l s='Connected with ChatsappAI.' d='chaindesk'}</h2>
        <p>{l s='You can now use ChatsappAIfrom your homepage.' d='chaindesk'}</p>
        <a href="{$add_to_chaindesk_link}" class="btn btn-primary pointer ">{l s='Reconfigure' d='chaindesk'}</a>
    </div>
{else}
<div class="alert alert-info">
    <h2>{l s='Connect with ChatsappAI' d='chaindesk'}</h2>
    <p>{l s='This link will redirect you to ChatsappAIand configure your PrestaShop.' d='chaindesk'}</p>
    <a href="{$add_to_chaindesk_link}" class="btn btn-primary">{l s='Connect with ChatsappAI' d='chaindesk'}</a>
</div>
</div>
{/if}
